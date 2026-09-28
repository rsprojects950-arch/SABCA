import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { PollOption, PollResult } from '@/app/services/polls';
import { useTheme } from '../../../ctx/ThemeContext';

interface PollResultBarProps {
    option: PollOption;
    result?: PollResult;
    isMyVote: boolean;
    totalVotes: number;
}

export const PollResultBar: React.FC<PollResultBarProps> = ({ option, result, isMyVote, totalVotes }) => {
    const { colors, isDark } = useTheme();
    const percentage = result?.percentage || 0;
    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: percentage,
            duration: 800,
            useNativeDriver: false, // width animation doesn't support native driver
        }).start();
    }, [percentage]);

    return (
        <View style={[
            styles.container,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' },
            isMyVote && [styles.containerMyVote, { borderColor: isDark ? 'rgba(59, 130, 246, 0.5)' : '#93C5FD' }]
        ]}>
            {/* Background Animated Fill */}
            <Animated.View
                style={[
                    styles.fillBar,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' },
                    isMyVote && [styles.fillBarMyVote, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#DBEAFE' }],
                    {
                        width: animatedWidth.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                        })
                    }
                ]}
            />

            {/* Content over the bar */}
            <View style={styles.contentRow}>
                <View style={styles.textGroup}>
                    <Text style={[styles.optionText, { color: colors.text }, isMyVote && { fontWeight: 'bold' }]} numberOfLines={2}>
                        {option.option_text}
                    </Text>
                    {isMyVote && (
                        <CheckCircle2 size={16} color={isDark ? '#60A5FA' : '#3B82F6'} style={styles.checkIcon} />
                    )}
                </View>

                <Text style={[styles.percentageText, { color: colors.text }]}>
                    {percentage}%
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 48,
        borderRadius: 10,
        marginBottom: 8,
        overflow: 'hidden',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    containerMyVote: {
        borderWidth: 1.5,
    },
    fillBar: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        backgroundColor: '#E2E8F0', // Gray fill for non-voted options
        borderRadius: 8,
    },
    fillBarMyVote: {
        backgroundColor: '#DBEAFE', // Light blue fill for chosen option
    },
    contentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 1, // Ensure text stays above the animated fill bar
    },
    textGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 16,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    checkIcon: {
        marginLeft: 8,
    },
    percentageText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
