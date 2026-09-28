import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * A hook that provides a consistent interface for triggering haptic feedback.
 * Includes platform checks to ensure haptics are only triggered when appropriate.
 */
export const useHaptics = () => {
    const lightImpact = useCallback(async () => {
        if (Platform.OS !== 'web') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, []);

    const mediumImpact = useCallback(async () => {
        if (Platform.OS !== 'web') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }, []);

    const heavyImpact = useCallback(async () => {
        if (Platform.OS !== 'web') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
    }, []);

    const successFeedback = useCallback(async () => {
        if (Platform.OS !== 'web') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, []);

    const errorFeedback = useCallback(async () => {
        if (Platform.OS !== 'web') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, []);

    const warningFeedback = useCallback(async () => {
        if (Platform.OS !== 'web') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    }, []);

    const selectionFeedback = useCallback(async () => {
        if (Platform.OS !== 'web') {
            await Haptics.selectionAsync();
        }
    }, []);

    return {
        lightImpact,
        mediumImpact,
        heavyImpact,
        successFeedback,
        errorFeedback,
        warningFeedback,
        selectionFeedback,
    };
};
