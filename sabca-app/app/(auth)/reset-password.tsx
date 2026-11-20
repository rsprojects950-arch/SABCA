import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, BackHandler } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../ctx/ThemeContext';
import { useAuth } from '../../ctx/AuthContext';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifyingSession, setVerifyingSession] = useState(true);
    const [localError, setLocalError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const {
        session,
        isLoading: authLoading,
        isProcessingRecoveryLink,
        recoveryError,
        clearPasswordRecovery,
    } = useAuth();

    const { code, token_hash, access_token, refresh_token, error: urlError, error_description } = useLocalSearchParams<{
        code?: string;
        token_hash?: string;
        access_token?: string;
        refresh_token?: string;
        error?: string;
        error_description?: string;
    }>();

    const handleBackToLogin = useCallback(async () => {
        clearPasswordRecovery();
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        router.replace('/(auth)/login');
    }, [clearPasswordRecovery, router]);

    useEffect(() => {
        const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
            void handleBackToLogin();
            return true;
        });
        return () => backSub.remove();
    }, [handleBackToLogin]);

    useEffect(() => {
        if (recoveryError || urlError || error_description) {
            const desc =
                recoveryError ||
                (typeof error_description === 'string' ? error_description : undefined) ||
                'This password reset link is invalid or has expired. Please request a new one from the Login screen.';
            setLocalError(desc);
            setVerifyingSession(false);
            return;
        }

        if (authLoading || isProcessingRecoveryLink) {
            setVerifyingSession(true);
            return;
        }

        if (session) {
            setLocalError(null);
            setVerifyingSession(false);
            return;
        }

        // Wait briefly for in-flight deep-link session establishment
        const timer = setTimeout(() => {
            setLocalError(
                'We could not verify your reset link. It may have expired or already been used. Please request a new one from the Login screen.'
            );
            setVerifyingSession(false);
        }, 4000);
        return () => clearTimeout(timer);
    }, [session, authLoading, isProcessingRecoveryLink, recoveryError, urlError, error_description, code, token_hash, access_token, refresh_token]);

    const handleUpdatePassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            clearPasswordRecovery();
            await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            Alert.alert(
                'Success',
                'Your password has been updated! Please sign in with your new password.',
                [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
            );
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen options={{
                headerShown: true,
                title: 'Reset Password',
                headerTransparent: true,
                headerTintColor: '#FFF',
                headerBackVisible: false,
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => void handleBackToLogin()}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingRight: 8 }}
                    >
                        <ArrowLeft size={20} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 4 }}>Login</Text>
                    </TouchableOpacity>
                ),
            }} />
            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B', '#1E293B'] : Colors.gradients.primary}
                style={styles.background}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>New Password</Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#E2E8F0' }]}>Create a strong new password</Text>
                </View>

                <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={[styles.formContainer, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.1)' }]}>
                    {verifyingSession ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFF" />
                            <Text style={styles.loadingText}>Verifying session...</Text>
                        </View>
                    ) : localError ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorTitle}>Reset Link Issue</Text>
                            <Text style={styles.errorDescription}>{localError}</Text>
                            <TouchableOpacity
                                style={[styles.button, { width: '100%', marginTop: 16 }]}
                                onPress={() => void handleBackToLogin()}
                            >
                                <LinearGradient
                                    colors={isDark ? ['#3B82F6', '#2563EB'] : Colors.gradients.button}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.buttonText}>Back to Login</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(17, 18, 20, 0.6)' : 'rgba(0, 0, 0, 0.2)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)' }]}>
                                <Lock size={20} color={isDark ? '#64748B' : '#E2E8F0'} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="New Password"
                                    placeholderTextColor={isDark ? '#475569' : '#AAC'}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    {showPassword ? <EyeOff size={20} color={isDark ? '#64748B' : '#E2E8F0'} /> : <Eye size={20} color={isDark ? '#64748B' : '#E2E8F0'} />}
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(17, 18, 20, 0.6)' : 'rgba(0, 0, 0, 0.2)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)' }]}>
                                <Lock size={20} color={isDark ? '#64748B' : '#E2E8F0'} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    placeholderTextColor={isDark ? '#475569' : '#AAC'}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleUpdatePassword}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <LinearGradient
                                        colors={isDark ? ['#3B82F6', '#2563EB'] : Colors.gradients.button}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.gradientButton}
                                    >
                                        <Text style={styles.buttonText}>Update Password</Text>
                                    </LinearGradient>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </BlurView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 5,
    },
    formContainer: {
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        height: '100%', // Ensure consistent height
        paddingVertical: 0, // Fix jitter on some Android versions
    },
    eyeIcon: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 32, // Prevent layout shift
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        color: '#FFF',
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
    },
    errorContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    errorTitle: {
        color: '#FCA5A5',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorDescription: {
        color: '#E2E8F0',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    button: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 6,
    },
    gradientButton: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
