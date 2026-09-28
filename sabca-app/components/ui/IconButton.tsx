import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useHaptics } from '../../hooks/useHaptics';

interface IconButtonProps {
    icon: React.ReactNode;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    size?: number;
    gradient?: readonly [string, ...string[]];
    backgroundColor?: string;
}

export default function IconButton({
    icon,
    onPress,
    loading = false,
    disabled = false,
    style,
    size = 56,
    gradient,
    backgroundColor
}: IconButtonProps) {
    const { lightImpact } = useHaptics();

    const handlePress = () => {
        lightImpact();
        onPress();
    };

    const containerStyle = [
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        style
    ];

    if (gradient) {
        return (
            <TouchableOpacity
                style={containerStyle}
                onPress={handlePress}
                disabled={disabled || loading}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={disabled ? ['#9CA3AF', '#9CA3AF'] : gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradient, { borderRadius: size / 2 }]}
                >
                    {loading ? <ActivityIndicator color="#FFF" size="small" /> : icon}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[
                containerStyle,
                {
                    backgroundColor: disabled ? '#9CA3AF' : (backgroundColor || Colors.light.primary)
                }
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? <ActivityIndicator color="#FFF" size="small" /> : icon}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
        overflow: 'hidden',
    },
    gradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
