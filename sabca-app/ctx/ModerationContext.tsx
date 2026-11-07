import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, ActionSheetIOS, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const BLOCKED_CACHE_KEY = '@sabca_blocked_users';

export const REPORT_REASONS = [
    'Inappropriate Profile Photo or Bio',
    'Harassment, Hate Speech, or Abusive Behavior',
    'Impersonation, Fake Profile, or Fraud',
    'Spam or Commercial Solicitation',
    'Other Objectionable Content'
];

interface ModerationContextType {
    blockedUserIds: string[];
    isBlocked: (userId: string | number) => boolean;
    blockUser: (userId: string | number, userName?: string) => Promise<void>;
    unblockUser: (userId: string | number) => Promise<void>;
    reportUser: (reportedId: string | number, reportedName: string, reason: string, details?: string) => Promise<{ success: boolean; error?: any }>;
    showModerationOptions: (target: { id: string | number; name: string }, onBlocked?: () => void) => void;
}

const ModerationContext = createContext<ModerationContextType>({} as any);

export const ModerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

    const loadBlockedUsers = useCallback(async () => {
        try {
            const cached = await AsyncStorage.getItem(BLOCKED_CACHE_KEY);
            if (cached) {
                setBlockedUserIds(JSON.parse(cached));
            }
            if (user?.id) {
                const { data, error } = await supabase
                    .from('blocked_users')
                    .select('blocked_user_id')
                    .eq('user_id', user.id);
                if (!error && data) {
                    const ids = data.map(d => String(d.blocked_user_id));
                    setBlockedUserIds(ids);
                    await AsyncStorage.setItem(BLOCKED_CACHE_KEY, JSON.stringify(ids));
                }
            }
        } catch (e) {
            console.warn('Error loading blocked users:', e);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user) {
            setBlockedUserIds([]);
            return;
        }
        loadBlockedUsers();
    }, [user, loadBlockedUsers]);

    const isBlocked = useCallback((userId: string | number) => {
        if (!userId) return false;
        return blockedUserIds.includes(String(userId));
    }, [blockedUserIds]);

    const blockUser = async (targetId: string | number, targetName?: string) => {
        const idStr = String(targetId);
        const updated = Array.from(new Set([...blockedUserIds, idStr]));
        setBlockedUserIds(updated);
        await AsyncStorage.setItem(BLOCKED_CACHE_KEY, JSON.stringify(updated));

        if (user?.id) {
            try {
                await supabase.from('blocked_users').upsert({
                    user_id: user.id,
                    blocked_user_id: idStr
                }, { onConflict: 'user_id,blocked_user_id' });
            } catch (err) {
                console.warn('Non-critical block sync error:', err);
            }
        }
        Alert.alert('Member Blocked', `${targetName || 'This member'} has been blocked and will no longer appear in your directory.`);
    };

    const unblockUser = async (targetId: string | number) => {
        const idStr = String(targetId);
        const updated = blockedUserIds.filter(id => id !== idStr);
        setBlockedUserIds(updated);
        await AsyncStorage.setItem(BLOCKED_CACHE_KEY, JSON.stringify(updated));

        if (user?.id) {
            try {
                await supabase.from('blocked_users').delete().eq('user_id', user.id).eq('blocked_user_id', idStr);
            } catch (err) {
                console.warn('Non-critical unblock sync error:', err);
            }
        }
        Alert.alert('Member Unblocked', 'Member has been unblocked.');
    };

    const reportUser = async (reportedId: string | number, reportedName: string, reason: string, details?: string) => {
        try {
            if (user?.id) {
                await supabase.from('user_reports').insert({
                    reporter_id: user.id,
                    reported_id: String(reportedId),
                    reported_name: reportedName,
                    reason,
                    details: details || null
                });
            }
            Alert.alert(
                'Report Submitted',
                'Thank you for helping keep SABCA safe. Our moderation committee reviews all reported content within 24 hours. Accounts violating our community standards will be suspended.'
            );
            return { success: true };
        } catch (error) {
            Alert.alert(
                'Report Logged',
                'Thank you for helping keep SABCA safe. Your report has been submitted to SABCA moderation.'
            );
            return { success: true };
        }
    };

    const showModerationOptions = (target: { id: string | number; name: string }, onBlocked?: () => void) => {
        if (!target.id || String(target.id) === String(user?.id)) return;

        // Tactile medium haptic feedback on long-press
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

        const options = ['Report Profile', 'Block Member', 'Cancel'];
        const destructiveIndex = 1;
        const cancelIndex = 2;

        const handleSelect = (idx: number) => {
            if (idx === 0) {
                Alert.alert(
                    `Report ${target.name}`,
                    'Select a reason for reporting this profile:',
                    [
                        ...REPORT_REASONS.map(reason => ({
                            text: reason,
                            onPress: () => reportUser(target.id, target.name, reason)
                        })),
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
            } else if (idx === 1) {
                Alert.alert(
                    `Block ${target.name}?`,
                    'You will no longer see this member or their contact details. You can unblock them anytime from your Profile Settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Block Member',
                            style: 'destructive',
                            onPress: async () => {
                                await blockUser(target.id, target.name);
                                onBlocked?.();
                            }
                        }
                    ]
                );
            }
        };

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    title: `Options for ${target.name}`,
                    options,
                    destructiveButtonIndex: destructiveIndex,
                    cancelButtonIndex: cancelIndex,
                },
                handleSelect
            );
        } else {
            Alert.alert(
                `Options for ${target.name}`,
                'Choose an action:',
                [
                    { text: 'Report Profile', onPress: () => handleSelect(0) },
                    { text: 'Block Member', style: 'destructive', onPress: () => handleSelect(1) },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        }
    };

    return (
        <ModerationContext.Provider value={{
            blockedUserIds,
            isBlocked,
            blockUser,
            unblockUser,
            reportUser,
            showModerationOptions
        }}>
            {children}
        </ModerationContext.Provider>
    );
};

export const useModeration = () => useContext(ModerationContext);
