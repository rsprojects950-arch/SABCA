import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

import { useTheme } from '../../ctx/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export default function PrimaryButton({
    title,
    onPress,
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon
}: PrimaryButtonProps) {
    const { colors } = useTheme();
    const { lightImpact } = useHaptics();

    const handlePress = () => {
        lightImpact();
        onPress();
    };

    return (
        <TouchableOpacity
            style={[styles.container, { shadowColor: colors.secondary }, style]}
            onPress={handlePress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={disabled ? ['#9CA3AF', '#9CA3AF'] : Colors.gradients.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        {icon && <>{icon}</>}
                        <Text style={[styles.text, textStyle]}>{title}</Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        // shadowColor handled dynamically
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    gradient: {
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
    },
    text: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
