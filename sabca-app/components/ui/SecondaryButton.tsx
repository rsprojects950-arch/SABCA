import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

import { useTheme } from '../../ctx/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';

interface SecondaryButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export default function SecondaryButton({
    title,
    onPress,
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon
}: SecondaryButtonProps) {
    const { colors } = useTheme();
    const { lightImpact } = useHaptics();

    const handlePress = () => {
        lightImpact();
        onPress();
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { borderColor: colors.primary },
                disabled && styles.containerDisabled,
                style
            ]}
            onPress={handlePress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={colors.primary} />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text style={[
                        styles.text,
                        { color: colors.primary },
                        disabled && styles.textDisabled,
                        textStyle
                    ]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 50,
        borderRadius: 12,
        borderWidth: 2,
        // borderColor handled dynamically
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
    },
    containerDisabled: {
        borderColor: '#9CA3AF',
        opacity: 0.5,
    },
    text: {
        // color handled dynamically
        fontWeight: '600',
        fontSize: 16,
    },
    textDisabled: {
        color: '#9CA3AF',
    },
});
