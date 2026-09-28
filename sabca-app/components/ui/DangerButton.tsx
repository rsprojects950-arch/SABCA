import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useHaptics } from '../../hooks/useHaptics';

interface DangerButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export default function DangerButton({
    title,
    onPress,
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon
}: DangerButtonProps) {
    const { mediumImpact } = useHaptics();

    const handlePress = () => {
        mediumImpact();
        onPress();
    };

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={handlePress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={disabled ? ['#9CA3AF', '#9CA3AF'] : [Colors.light.error, '#DC2626']}
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
        shadowColor: Colors.light.error,
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
