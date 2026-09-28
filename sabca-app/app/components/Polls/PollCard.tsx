import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, Trash2 } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { PollQuestion } from '@/app/services/polls';
import { useTheme } from '../../../ctx/ThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';

interface PollCardProps {
    poll: PollQuestion;
    canDelete?: boolean;
    onDelete?: (id: string) => void;
    children: React.ReactNode;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, canDelete, onDelete, children }) => {
    const { colors, isDark } = useTheme();
    const { mediumImpact } = useHaptics();
    const isExpired = poll.status === 'closed';

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
            {/* Header Topic Row */}
            <View style={styles.headerRow}>
                <View style={styles.timeInfo}>
                    <Calendar size={14} color={isExpired ? '#94A3B8' : '#F59E0B'} />
                    <Text style={[styles.timeText, isExpired ? styles.timeTextExpired : { color: '#F59E0B' }]}>
                        {isExpired ? 'Closed' : 'Active Now'}
                    </Text>
                </View>
                {canDelete && onDelete && (
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => { mediumImpact(); onDelete(poll.id); }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>

            {/* The Question */}
            <Text style={[styles.questionText, { color: colors.text }]}>{poll.question}</Text>

            {/* The Options or Results Array */}
            <View style={{ maxHeight: 300 }}>
                {/* Scrollable container for many options */}
                <ScrollView
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    contentContainerStyle={styles.optionsContainer}
                >
                    {children}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    deleteBtn: {
        padding: 4,
    },
    timeText: {
        color: Colors.light.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    timeTextExpired: {
        color: '#94A3B8',
    },
    questionText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
        lineHeight: 24,
    },
    optionsContainer: {
        gap: 8,
    },
});
