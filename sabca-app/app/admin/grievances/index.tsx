import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Search, Filter, Circle, AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react-native';

const STATUS_FILTERS = ['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Escalated'];

import { useTheme } from '../../../ctx/ThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';

export default function AdminGrievanceList() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const [grievances, setGrievances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchGrievances = async () => {
        try {
            let query = supabase
                .from('grievances')
                .select('*, profiles:profiles!grievances_user_id_fkey_profiles(full_name, avatar_url, division)')
                .order('submitted_date', { ascending: false });

            if (activeFilter !== 'All') {
                query = query.eq('status', activeFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setGrievances(data || []);
        } catch (error) {
            console.error('Error fetching grievances:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchGrievances();
        }, [activeFilter])
    );

    const onRefresh = () => {
        lightImpact();
        setRefreshing(true);
        fetchGrievances();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return colors.error;
            case 'Medium': return colors.warning;
            case 'Low': return colors.success;
            default: return colors.icon;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Resolved': return <CheckCircle size={16} color={colors.success} />;
            case 'Escalated': return <AlertCircle size={16} color={colors.error} />;
            case 'In Progress': return <Clock size={16} color={colors.warning} />;
            default: return <Circle size={16} color={colors.icon} />;
        }
    };

    const filteredGrievances = grievances.filter(g =>
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.display_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => { lightImpact(); router.push(`/admin/grievances/${item.id}`); }}
        >
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.idText, { color: colors.icon }]}>#{item.display_id || item.id.slice(0, 8)}</Text>
                    <View style={styles.divisionRow}>
                        <Text style={[styles.divisionText, { color: '#BAE6FD' }]}>[{item.profiles?.division || 'General'}]</Text>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.dateText, { color: colors.icon, marginBottom: 6 }]}>{new Date(item.submitted_date).toLocaleDateString()}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
                    </View>
                </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
            <Text style={[styles.category, { color: colors.icon }]}>{item.category}</Text>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <View style={styles.statusRow}>
                    {getStatusIcon(item.status)}
                    <Text style={[styles.statusText, { color: colors.text }]}>{item.status || 'Submitted'}</Text>
                </View>
                {item.profiles?.full_name && (
                    <Text style={[styles.userText, { color: colors.icon }]}>by {item.profiles.full_name}</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Grievance Management</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search & Filter */}
            <View style={[styles.controls, { backgroundColor: colors.card }]}>
                <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
                    <Search size={20} color={colors.icon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search by ID or Title..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.icon}
                    />
                </View>

                <FlatList
                    data={STATUS_FILTERS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                    renderItem={({ item }) => {
                        const isSelected = activeFilter === item;

                        let bgColor = colors.background;
                        let textColor = colors.icon;

                        if (isSelected) {
                            if (item === 'All') {
                                bgColor = colors.primary;
                                textColor = '#FFFFFF';
                            } else if (item === 'Submitted') {
                                bgColor = '#64748B';
                                textColor = '#FFFFFF';
                            } else if (item === 'Under Review') {
                                bgColor = '#3B82F6';
                                textColor = '#FFFFFF';
                            } else if (item === 'In Progress') {
                                bgColor = '#F59E0B';
                                textColor = '#FFFFFF';
                            } else if (item === 'Resolved') {
                                bgColor = '#10B981';
                                textColor = '#FFFFFF';
                            } else if (item === 'Escalated') {
                                bgColor = '#EF4444';
                                textColor = '#FFFFFF';
                            }
                        }

                        return (
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    { backgroundColor: bgColor }
                                ]}
                                onPress={() => { lightImpact(); setActiveFilter(item); }}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { color: textColor },
                                    isSelected && styles.activeFilterText
                                ]}>{item}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* List */}
            <FlatList
                data={filteredGrievances}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: colors.icon }]}>No grievances found.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.light.card, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
    backButton: { padding: 8, marginLeft: -8 },
    controls: { backgroundColor: Colors.light.card, paddingBottom: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.background, marginHorizontal: 20, marginTop: 16, borderRadius: 12, paddingHorizontal: 12, height: 44 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: Colors.light.text },
    filterList: { paddingHorizontal: 20, marginTop: 16, gap: 8 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.light.background, marginRight: 8 },
    activeFilterChip: { backgroundColor: Colors.light.primary },
    filterText: { fontSize: 13, color: Colors.light.icon, fontWeight: '500' },
    activeFilterText: { color: '#FFF', fontWeight: 'bold' },
    listContent: { padding: 20 },
    card: { backgroundColor: Colors.light.card, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: Colors.light.icon, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
    divisionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 0 },
    divisionText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
    idText: { fontSize: 13, fontWeight: '700', color: Colors.light.icon },
    priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    priorityText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    dateText: { fontSize: 12, color: Colors.light.icon },
    title: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: 4 },
    category: { fontSize: 13, color: Colors.light.icon, marginBottom: 12 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.light.border },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusText: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
    userText: { fontSize: 12, color: Colors.light.icon },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: Colors.light.icon, fontSize: 16 }
});
