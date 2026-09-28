import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    isAdmin: boolean;
    userRole: string | null; // Add userRole
    isProfileComplete: boolean;
    isMembershipActive: boolean;
    refreshProfile?: () => Promise<void>;
    isBiometricEnabled: boolean;
    setBiometricEnabled: (enabled: boolean, credentials?: { email: string; pass: string }) => Promise<void>;
    signInWithBiometrics: () => Promise<{ data: { session: Session | null; user: User | null }; error: any }>;
    deleteAccount: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    isAdmin: false,
    userRole: null,
    isProfileComplete: true,
    isMembershipActive: true,
    isBiometricEnabled: false,
    setBiometricEnabled: async () => { },
    signInWithBiometrics: async () => ({ data: { session: null, user: null }, error: new Error('Not implemented') }),
    deleteAccount: async () => ({ error: new Error('Not implemented') }),
});

export const useAuth = () => useContext(AuthContext);

import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_KEY = 'BIOMETRIC_ENABLED';
const CREDENTIALS_KEY = 'USER_CREDENTIALS';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null); // Add state
    const [isProfileComplete, setIsProfileComplete] = useState(true);
    const [isMembershipActive, setIsMembershipActive] = useState(true);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

    useEffect(() => {
        // Load Biometric Preference
        SecureStore.getItemAsync(BIOMETRIC_KEY).then(val => {
            setIsBiometricEnabled(val === 'true');
        });
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error("Auth Session Error:", error);
                if (error.message.includes("Refresh Token")) {
                    supabase.auth.signOut();
                    setSession(null);
                    setUser(null);
                    setIsLoading(false);
                    return;
                }
            }
            setSession(session);
            setUser(session?.user ?? null);
            checkUser(session?.user);
            setIsLoading(false);
        }).catch(err => {
            console.error("Unexpected Auth Error:", err);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            checkUser(session?.user);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkUser = async (user: User | null | undefined) => {
        if (!user) {
            setIsAdmin(false);
            setUserRole(null);
            setIsProfileComplete(true);
            setIsMembershipActive(true);
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('role, division, full_name, phone, membership_expiry, is_paid_member')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.log('Error checking user profile:', error);
            setIsAdmin(false);
            setUserRole(null);
            setIsProfileComplete(false);
            setIsMembershipActive(false);
            return;
        }

        if (!data) {
            setIsAdmin(false);
            setUserRole(null);
            setIsProfileComplete(false);
            setIsMembershipActive(false);
            return;
        }

        const role = data?.role;
        setUserRole(role); // Set role

        const isAdminRole = role === 'admin' || role === 'moderator';
        setIsAdmin(isAdminRole);

        // Membership Status Check
        if (isAdminRole) {
            setIsMembershipActive(true);
        } else {
            const isPaid = data?.is_paid_member === true;
            if (data?.membership_expiry) {
                const expiryDate = new Date(data.membership_expiry);
                const now = new Date();
                const isActive = isPaid && expiryDate > now;
                setIsMembershipActive(isActive);
            } else {
                setIsMembershipActive(false);
            }
        }

        if (isAdminRole) {
            setIsProfileComplete(true);
        } else {
            const isComplete = !!(data?.division && data?.full_name);
            setIsProfileComplete(isComplete);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await checkUser(user);
        }
    };

    const setBiometricEnabled = async (enabled: boolean, credentials?: { email: string; pass: string }) => {
        try {
            if (enabled && credentials) {
                // Encrypt and store credentials
                await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
                await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
                setIsBiometricEnabled(true);
            } else {
                // Clear storage
                await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
                await SecureStore.setItemAsync(BIOMETRIC_KEY, 'false');
                setIsBiometricEnabled(false);
            }
        } catch (error) {
            console.error('Error setting biometrics:', error);
        }
    };

    const signInWithBiometrics = async () => {
        try {
            const credsJson = await SecureStore.getItemAsync(CREDENTIALS_KEY);
            if (!credsJson) throw new Error('No stored credentials found. Please log in normally once.');

            const { email, pass } = JSON.parse(credsJson);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: pass,
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Biometric sign-in error:', error);
            return { data: { session: null, user: null }, error };
        }
    };

    const deleteAccount = async () => {
        try {
            if (!user) {
                return { error: new Error('No user is currently logged in') };
            }

            // 1. Best-effort storage cleanup for user avatars
            try {
                const { data: avatarFiles } = await supabase.storage.from('avatars').list(user.id);
                if (avatarFiles && avatarFiles.length > 0) {
                    const paths = avatarFiles.map(f => `${user.id}/${f.name}`);
                    await supabase.storage.from('avatars').remove(paths);
                }
            } catch (storageErr) {
                console.warn('Storage cleanup non-critical error:', storageErr);
            }

            // 2. Call delete_own_account RPC
            const { error: rpcError } = await supabase.rpc('delete_own_account');
            if (rpcError) {
                console.error('Account deletion RPC error:', rpcError);
                return { error: rpcError };
            }

            // 3. Clean up biometrics & secure store
            try {
                await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
                await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
            } catch (secErr) {
                console.warn('Secure store cleanup error:', secErr);
            }

            // 4. Sign out and reset state
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setIsAdmin(false);
            setUserRole(null);
            setIsBiometricEnabled(false);

            return { error: null };
        } catch (error: any) {
            console.error('deleteAccount fatal error:', error);
            return { error };
        }
    };

    const value = React.useMemo(() => ({
        session,
        user,
        isLoading,
        isAdmin,
        userRole, // Expose role
        isProfileComplete,
        isMembershipActive,
        refreshProfile,
        isBiometricEnabled,
        setBiometricEnabled,
        signInWithBiometrics,
        deleteAccount,
    }), [session, user, isLoading, isAdmin, userRole, isProfileComplete, isMembershipActive, isBiometricEnabled]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
