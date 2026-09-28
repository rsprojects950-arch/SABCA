import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { PollOption } from '@/app/services/polls';
import { useTheme } from '../../../ctx/ThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';

interface PollOptionRadioProps {
    option: PollOption;
    onVote: (optionId: string) => void;
    isVoting: boolean;
    selectedOptionId: string | null;
}

export const PollOptionRadio: React.FC<PollOptionRadioProps> = ({ option, onVote, isVoting, selectedOptionId }) => {
    const { colors, isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const isSelected = selectedOptionId === option.id;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' },
                isSelected && [styles.containerSelected, { borderColor: Colors.light.primary, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]
            ]}
            onPress={() => { lightImpact(); onVote(option.id); }}
            disabled={isVoting}
            activeOpacity={0.7}
        >
            <View style={[styles.radioCircle, { borderColor: isDark ? 'rgba(255,255,255,0.3)' : '#CBD5E1' }, isSelected && styles.radioCircleSelected]}>
                {isSelected && <View style={styles.radioInner} />}
            </View>

            <Text style={[styles.optionText, { color: colors.text }, isSelected && styles.optionTextSelected]}>
                {option.option_text}
            </Text>

            {isSelected && isVoting && (
                <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginLeft: 'auto' }} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 10,
        borderWidth: 1.5,
        marginBottom: 8,
    },
    containerSelected: {
        borderWidth: 1.5,
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: Colors.light.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.light.primary,
    },
    optionText: {
        fontSize: 15,
        flex: 1,
    },
    optionTextSelected: {
        color: Colors.light.primary,
        fontWeight: '600',
    },
});
