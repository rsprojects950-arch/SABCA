import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../ctx/AuthContext';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../ctx/ThemeContext';
import { ArrowLeft, Bell, Calendar, Info, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NotificationRowSkeleton } from '../../components/Skeleton';

export default function NotificationsScreen() {
    const router = useRouter();
    const { user, isMembershipActive } = useAuth();
    const { colors, isDark } = useTheme();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user, isMembershipActive]);

    const fetchNotifications = async () => {
        try {
            if (!isMembershipActive) {
                // For unpaid/expired members, show ONLY renewal notification
                setNotifications([{
                    id: 'renewal-alert',
                    type: 'error',
                    title: 'Membership Expired',
                    message: 'Your membership is not active. Please renew to access all features and receive updates.',
                    created_at: new Date().toISOString(),
                    read: false,
                    action_path: '/member/renew'
                }]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);

        } catch (error) {

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handlePress = async (item: any) => {
        // 1. Mark as read immediately in UI
        if (!item.read) {
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));

            // Only update DB if it's a real notification (not the fake renewal one)
            if (item.id !== 'renewal-alert') {
                try {
                    await supabase.from('notifications').update({ read: true }).eq('id', item.id);
                } catch (e) {
                    console.error('Error marking as read', e);
                }
            }
        }

        // 2. Redirect if action_path exists
        if (item.action_path) {
            router.push(item.action_path);
        }
    };

    const handleMarkAllRead = async () => {
        const unreadIds = notifications
            .filter(n => !n.read && n.id !== 'renewal-alert') // Exclude fake alert
            .map(n => n.id);

        if (unreadIds.length === 0) return;

        // UI Optimistic Update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        try {
            await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
        } catch (e) {
            Alert.alert('Error', 'Failed to mark all as read');
            fetchNotifications(); // Revert on error
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={24} color="#10B981" />;
            case 'warning': return <AlertTriangle size={24} color="#F59E0B" />;
            case 'error': return <AlertTriangle size={24} color="#EF4444" />;
            default: return <Info size={24} color="#3B82F6" />;
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            style={[
                styles.card,
                { backgroundColor: colors.card },
                !item.read && { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#F0F9FF', paddingLeft: 20 }
            ]}
            onPress={() => handlePress(item)}
        >
            {!item.read && (
                <LinearGradient
                    colors={Colors.gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}
                />
            )}
            <View style={styles.iconContainer}>
                {getIcon(item.type)}
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.message, { color: colors.icon }]}>{item.message}</Text>
                <Text style={[styles.date, { color: colors.tabIconDefault }]}>
                    {new Date(item.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    })}
                </Text>
            </View>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={Colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.safeHeader}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Notifications</Text>
                        </View>

                        <TouchableOpacity onPress={handleMarkAllRead} style={styles.rightButton}>
                            <Text style={styles.markReadText}>Mark all read</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {loading ? (
                <View style={styles.listContent}>
                    <NotificationRowSkeleton />
                    <NotificationRowSkeleton />
                    <NotificationRowSkeleton />
                    <NotificationRowSkeleton />
                    <NotificationRowSkeleton />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.center}>
                    <Bell size={64} color={colors.border} />
                    <Text style={[styles.emptyText, { color: colors.icon }]}>No notifications yet</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    safeHeader: {
        backgroundColor: 'transparent',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center content collectively
        paddingHorizontal: 16,
        paddingTop: 8,
        position: 'relative',
        height: 48, // Fixed height for consistent centering
    },
    headerTitleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 8,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        zIndex: 10,
    },
    rightButton: {
        position: 'absolute',
        right: 16,
        top: 8,
        paddingTop: 10,  // Push the text down slightly
        paddingBottom: 6,
        paddingHorizontal: 8,
        zIndex: 10,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '500',
    },
    listContent: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        marginRight: 16,
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 8,
        lineHeight: 20,
    },
    date: {
        fontSize: 12,
        color: '#94A3B8',
    },
    markReadText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.light.primary,
        marginLeft: 8,
        alignSelf: 'center',
    },
});
