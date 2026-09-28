import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Search, FileText, Download, ArrowLeft, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../ctx/ThemeContext';
import { supabase, deleteFileFromUrl } from '../../lib/supabase';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDebounce } from '../../hooks/useDebounce';
import { DocumentRowSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../ctx/AuthContext';
import { useHaptics } from '../../hooks/useHaptics';

const PAGE_SIZE = 15;

export default function GOListScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { isAdmin, userRole } = useAuth();
    const { lightImpact } = useHaptics();
    const [searchQuery, setSearchQuery] = useState('');
    const canDelete = isAdmin || userRole === 'moderator';
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [downloading, setDownloading] = useState<string | null>(null);

    const fetchOrders = async ({ pageParam = 0 }) => {
        const from = pageParam * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
            .from('government_orders')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (debouncedSearch) {
            query = query.ilike('title', `%${debouncedSearch}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return { data, nextCursor: (data?.length === PAGE_SIZE && count && to < count - 1) ? pageParam + 1 : undefined };
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
        queryKey: ['government_orders', debouncedSearch],
        queryFn: fetchOrders,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    const orders = data?.pages.flatMap(page => page.data || []) || [];

    const handleDownload = async (url: string, title: string) => {
        if (!url) return;

        setDownloading(url);
        try {
            const fileExt = url.split('.').pop()?.split('?')[0] || 'pdf';
            const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

            const downloadRes = await FileSystem.downloadAsync(url, fileUri);

            if (downloadRes.status !== 200) {
                throw new Error('Failed to download file');
            }

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadRes.uri);
            } else {
                // Fallback to linking if sharing is not available
                Linking.openURL(url);
            }
        } catch (err: any) {
            console.error('Download error:', err);
            Alert.alert('Error', 'Failed to download or open document.');
        } finally {
            setDownloading(null);
        }
    };

    const handleDeleteOrder = async (orderId: string, fileUrl: string) => {
        Alert.alert(
            "Delete Government Order",
            "Are you sure you want to delete this G.O. and its associated file? This action cannot be undone.",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (fileUrl) {
                                await deleteFileFromUrl(fileUrl, 'government_orders');
                            }
                            const { error } = await supabase
                                .from('government_orders')
                                .delete()
                                .eq('id', orderId);

                            if (error) throw error;

                            Alert.alert('Success', 'Government Order deleted successfully.');
                            refetch();
                        } catch (err: any) {
                            Alert.alert('Error', 'Failed to delete Government Order.');
                            console.error(err);
                        }
                    }
                }
            ]
        );
    };

    const renderOrder = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.orderCard, { backgroundColor: colors.card, shadowColor: colors.shadow, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => handleDownload(item.file_url, item.title)}
            activeOpacity={0.7}
        >
            <View style={[styles.orderIcon, { backgroundColor: isDark ? 'rgba(229, 57, 53, 0.1)' : '#FEE2E2' }]}>
                <FileText size={24} color={colors.primary} />
            </View>
            <View style={styles.orderInfo}>
                <Text style={[styles.orderTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                {item.description ? (
                    <Text style={[styles.orderDesc, { color: colors.icon }]} numberOfLines={1}>{item.description}</Text>
                ) : null}
                <Text style={[styles.orderDate, { color: colors.icon }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
            <View style={styles.rightActionsContainer}>
                {canDelete && (
                    <TouchableOpacity
                        onPress={() => { lightImpact(); handleDeleteOrder(item.id, item.file_url); }}
                        style={styles.deleteIconBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Trash2 size={20} color="#EF4444" style={{ marginRight: 12 }} />
                    </TouchableOpacity>
                )}
                {downloading === item.file_url ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Download size={20} color={colors.icon} />
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Government Orders</Text>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
                    <Search size={20} color={colors.icon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search G.O.s..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.icon}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.listContent}>
                    <DocumentRowSkeleton />
                    <DocumentRowSkeleton />
                    <DocumentRowSkeleton />
                    <DocumentRowSkeleton />
                    <DocumentRowSkeleton />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={refetch}
                    refreshing={isRefetching}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetchingNextPage ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} /> : <View style={{ height: 20 }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <FileText size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.icon }]}>No Government Orders found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text },
    searchContainer: { padding: 16, backgroundColor: '#FFF' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 48, gap: 10 },
    searchInput: { flex: 1, fontSize: 16, color: Colors.light.text },
    listContent: { padding: 16, paddingBottom: 40 },
    orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    orderIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    orderInfo: { flex: 1 },
    orderTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: 4 },
    orderDesc: { fontSize: 13, color: '#64748B', marginBottom: 4 },
    orderDate: { fontSize: 11, color: '#94A3B8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, gap: 16 },
    emptyText: { color: '#94A3B8', fontSize: 16 },
    rightActionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteIconBtn: {
        padding: 4,
    }
});
