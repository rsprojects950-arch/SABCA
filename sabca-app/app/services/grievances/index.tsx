import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ActionSheetIOS, Platform, Alert, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Filter, ArrowLeft, AlertCircle, Calendar, Building2, Clock, CheckCircle, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../ctx/AuthContext';
import { useTheme } from '../../../ctx/ThemeContext';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useHaptics } from '../../../hooks/useHaptics';
import { GrievanceCardSkeleton } from '../../../components/Skeleton';

const PAGE_SIZE = 15;

interface Grievance {
    id: string;
    display_id: string;
    submitted_date: string;
    status: string;
    title: string;
    category: string;
    department: string;
}

export default function GrievanceListScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const [filter, setFilter] = useState('All');

    const fetchGrievances = async ({ pageParam = 0 }) => {
        if (!user) return { data: [], nextCursor: undefined };

        const from = pageParam * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
            .from('grievances')
            .select('id, display_id, submitted_date, status, title, category, department', { count: 'exact' })
            .order('submitted_date', { ascending: false })
            .range(from, to);

        if (filter !== 'All') {
            query = query.eq('status', filter);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return {
            data,
            nextCursor: (data?.length === PAGE_SIZE && count && to < count - 1) ? pageParam + 1 : undefined
        };
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
        isRefetching
    } = useInfiniteQuery({
        queryKey: ['grievances', user?.id, filter], // Add filter to key
        queryFn: fetchGrievances,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: !!user,
    });

    const grievances = data?.pages.flatMap(page => page.data || []) || [];

    const onRefresh = () => {
        refetch();
    };

    const filterOptions = ['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Escalated'];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Submitted': return isDark ? '#E2E8F0' : '#64748B'; // Much lighter for better visibility in dark mode
            case 'Under Review': return '#3B82F6';
            case 'In Progress': return '#F59E0B';
            case 'Resolved': return '#10B981';
            case 'Escalated': return '#EF4444';
            default: return '#64748B';
        }
    };

    const isOverdue = (dateString: string, status: string) => {
        if (status === 'Resolved' || status === 'Rejected') return false;
        const submitDate = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - submitDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 30;
    };

    const renderGrievance = ({ item }: { item: Grievance }) => {
        const isEscalatedRow = item.status === 'Escalated' || isOverdue(item.submitted_date, item.status);
        const statusColor = getStatusColor(item.status);

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.background },
                    isEscalatedRow && [styles.escalatedCardBorder, { borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECACA' }]
                ]}
                onPress={() => { lightImpact(); router.push(`/services/grievances/${item.id}`); }}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <Text style={[styles.idText, { color: colors.icon }]}>{item.display_id || 'GRV-....'}</Text>
                        <View style={styles.dateRow}>
                            <Clock size={12} color={colors.icon} />
                            <Text style={[styles.dateText, { color: colors.icon }]}>
                                {new Date(item.submitted_date).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : `${statusColor}25` }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                    </View>
                </View>

                {/* ... rest of card content */}
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.category, { color: colors.icon, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>{item.category}</Text>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.cardFooter}>
                    <View style={styles.departmentRow}>
                        <Building2 size={14} color={colors.icon} />
                        <Text style={[styles.departmentValue, { color: colors.icon }]}>{item.department || 'General'}</Text>
                    </View>
                    {isEscalatedRow && (
                        <LinearGradient
                            colors={isDark ? ['rgba(254, 242, 242, 0.1)', 'rgba(254, 202, 202, 0.1)'] : ['#FEF2F2', '#FECACA']}
                            style={styles.escalatedBadge}
                        >
                            <AlertTriangle size={12} color={Colors.light.error} />
                            <Text style={[styles.escalatedText, { color: Colors.light.error }]}>
                                {item.status === 'Escalated' ? 'Escalated' : 'Overdue'}
                            </Text>
                        </LinearGradient>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />
            {/* Custom Gradient Header */}
            <LinearGradient
                colors={isDark ? ['rgba(229, 57, 53, 0.2)', 'rgba(142, 68, 173, 0.2)'] : Colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.safeHeader}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/services')} style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <ArrowLeft size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Grievances</Text>
                        <View style={{ width: 40 }} />
                    </View>

                </SafeAreaView>
            </LinearGradient>

            {/* Horizontal Filter Chips - Moved Outside Header */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContent}
                >
                    {filterOptions.map((option) => (
                        <TouchableOpacity
                            key={option}
                            onPress={() => { lightImpact(); setFilter(option); }}
                            style={[
                                styles.filterChip,
                                filter === option ?
                                    { backgroundColor: option === 'All' ? colors.primary : getStatusColor(option), borderWidth: 0 } :
                                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0', borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.border }
                            ]}
                        >
                            <Text style={[
                                styles.filterText,
                                filter === option ?
                                    { color: option === 'Submitted' ? colors.background : '#FFF' } :
                                    { color: option === 'All' ? colors.text : getStatusColor(option) }
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {isLoading ? (
                <View style={styles.listContent}>
                    <GrievanceCardSkeleton />
                    <GrievanceCardSkeleton />
                    <GrievanceCardSkeleton />
                </View>
            ) : (
                <FlatList
                    data={grievances}
                    renderItem={renderGrievance}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                    }
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <AlertTriangle size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.icon }]}>No grievances found.</Text>
                            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/services/grievances/new')}>
                                <Text style={styles.submitBtnText}>Submit New Grievance</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    ListFooterComponent={
                        isFetchingNextPage ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} /> : <View style={{ height: 20 }} />
                    }
                />
            )}
            {/* FAB Removed */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    header: {
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 10,
    },
    safeHeader: {
        backgroundColor: 'transparent',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    filterContainer: {
        marginTop: 12,
        paddingBottom: 8,
    },
    filterContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 20,
        paddingBottom: 100,
        paddingTop: 24, // overlap margin
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F8FAFC',
    },
    escalatedCardBorder: {
        borderColor: '#FECACA',
        borderWidth: 1.5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        gap: 4,
    },
    idText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#94A3B8',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 6,
    },
    category: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 16,
        backgroundColor: '#F1F5F9',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    departmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    departmentValue: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    escalatedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    escalatedText: {
        fontSize: 11,
        color: '#EF4444',
        fontWeight: '700',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
        paddingTop: 24,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        marginTop: 40,
    },
    submitBtn: {
        marginTop: 20,
        backgroundColor: Colors.light.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
