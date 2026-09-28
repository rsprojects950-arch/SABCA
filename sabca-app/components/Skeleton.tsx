import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../ctx/ThemeContext';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const { isDark } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    const backgroundColor = isDark ? '#334155' : '#E2E8F0';

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor,
                    opacity,
                },
                style,
            ]}
        />
    );
};

// Composite Skeletons
export const EventCardSkeleton = () => {
    const { colors } = useTheme();
    return (
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton height={180} borderRadius={16} style={styles.mb12} />
            <Skeleton width="80%" height={24} style={styles.mb8} />
            <Skeleton width="50%" height={16} style={styles.mb12} />
            <View style={styles.rowBetween}>
                <Skeleton width="30%" height={16} />
                <Skeleton width="25%" height={32} borderRadius={16} />
            </View>
        </View>
    );
};

export const NewsRowSkeleton = () => {
    const { colors } = useTheme();
    return (
        <View style={[styles.newsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton width={80} height={80} borderRadius={12} style={styles.mr12} />
            <View style={styles.flex1}>
                <Skeleton width="90%" height={20} style={styles.mb8} />
                <Skeleton width="40%" height={14} style={styles.mb8} />
                <Skeleton width="60%" height={14} />
            </View>
        </View>
    );
};

export const MemberCardSkeleton = () => {
    const { colors } = useTheme();
    return (
        <View style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton width={44} height={44} borderRadius={22} style={styles.mr12} />
            <View style={styles.flex1}>
                <Skeleton width="60%" height={18} style={styles.mb6} />
                <Skeleton width="40%" height={14} />
            </View>
        </View>
    );
};

export const GrievanceCardSkeleton = () => {
    const { colors } = useTheme();
    return (
        <View style={[styles.grievanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.rowBetween, styles.mb12]}>
                <Skeleton width="35%" height={20} borderRadius={4} />
                <Skeleton width="25%" height={24} borderRadius={12} />
            </View>
            <Skeleton width="85%" height={18} style={styles.mb8} />
            <Skeleton width="50%" height={14} style={styles.mb12} />
            <View style={styles.rowBetween}>
                <Skeleton width="30%" height={14} />
                <Skeleton width="20%" height={14} />
            </View>
        </View>
    );
};

export const DocumentRowSkeleton = () => {
    const { colors } = useTheme();
    return (
        <View style={[styles.documentRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton width={32} height={32} borderRadius={8} style={styles.mr12} />
            <View style={styles.flex1}>
                <Skeleton width="70%" height={16} style={styles.mb6} />
                <Skeleton width="30%" height={12} />
            </View>
        </View>
    );
};

export const NotificationRowSkeleton = () => {
    const { colors } = useTheme();
    return (
        <View style={[styles.notificationRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton width={40} height={40} borderRadius={20} style={styles.mr12} />
            <View style={styles.flex1}>
                <Skeleton width="90%" height={16} style={styles.mb6} />
                <Skeleton width="40%" height={12} />
            </View>
        </View>
    );
};

export const PollCardSkeleton = () => {
    const { colors } = useTheme();
    return (
        <View style={[styles.pollCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton width="75%" height={20} style={styles.mb12} />
            <Skeleton width="100%" height={40} borderRadius={12} style={styles.mb8} />
            <Skeleton width="100%" height={40} borderRadius={12} style={styles.mb8} />
            <View style={[styles.rowBetween, styles.mt8]}>
                <Skeleton width="30%" height={14} />
                <Skeleton width="15%" height={14} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mr12: { marginRight: 12 },
    mb6: { marginBottom: 6 },
    mb8: { marginBottom: 8 },
    mb12: { marginBottom: 12 },
    mt8: { marginTop: 8 },
    flex1: { flex: 1 },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    // Event Card Styles
    cardContainer: {
        borderRadius: 20,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    // News Row Styles
    newsRow: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    // Member Card Styles
    memberCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    // Grievance Card Styles
    grievanceCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    // Document Row Styles
    documentRow: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    // Notification Row Styles
    notificationRow: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    // Poll Card Styles
    pollCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
});
