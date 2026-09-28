import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Clock, ArrowUpRight, ArrowDownLeft, Download } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { SecondaryButton } from '../../components/ui';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../ctx/AuthContext';
import { useTheme } from '../../ctx/ThemeContext';
import { generateReceiptPDF } from '../../lib/receiptGenerator';

export default function HistoryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        fetchTransactions();
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setUserProfile(data);
    };

    const fetchTransactions = async () => {
        try {
            // Join with profiles to get user details for each transaction
            const { data, error } = await supabase
                .from('transactions')
                .select('*, profiles:user_id(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setTransactions(data || []);
        } catch (e) {
            console.error('Error fetching transactions:', e);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        return status === 'Success' ? Colors.light.success : Colors.light.error;
    };

    const handleDownloadReceipt = async (txn: any) => {
        // Use the profile attached to the transaction, fallback to current user's profile
        const targetProfile = txn.profiles || userProfile;

        if (!targetProfile) {
            Alert.alert('Error', 'User profile not associated with this transaction');
            return;
        }
        await generateReceiptPDF(txn, targetProfile);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card }]}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>History</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <View style={styles.timeline}>
                        {transactions.map((txn, index) => (
                            <View key={txn.id} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    <View style={[styles.timelineLine, {
                                        height: index === transactions.length - 1 ? 0 : '150%',
                                        backgroundColor: colors.border
                                    }]} />
                                    <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', borderColor: colors.border }]}>
                                        {txn.type === 'Renewal' ?
                                            <Clock size={16} color={colors.primary} /> :
                                            <ArrowUpRight size={16} color="#EC4899" />
                                        }
                                    </View>
                                </View>
                                <View style={styles.cardWrapper}>
                                    <View style={[styles.txnCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                                        <View style={styles.txnHeader}>
                                            <View>
                                                <Text style={[styles.txnDate, { color: colors.text }]}>{txn.date}</Text>
                                                <Text style={[styles.txnId, { color: colors.icon }]}>ID: {txn.txn_ref || txn.id}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(txn.status) + (isDark ? '30' : '15') }]}>
                                                <Text style={[styles.statusText, { color: getStatusColor(txn.status) }]}>{txn.status}</Text>
                                            </View>
                                        </View>

                                        <Text style={[styles.txnDesc, { color: colors.text }]}>{txn.description}</Text>
                                        <Text style={[styles.txnAmount, { color: colors.error }]}>{txn.amount}</Text>

                                        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                                            <SecondaryButton
                                                title="Download Receipt"
                                                icon={<Download size={16} color={colors.primary} />}
                                                onPress={() => handleDownloadReceipt(txn)}
                                                style={{ height: 40, backgroundColor: 'transparent', borderColor: colors.border }}
                                                textStyle={{ fontSize: 13, color: colors.primary }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.light.card,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.light.icon,
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    content: {
        padding: 24,
    },
    timeline: {
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 16,
        width: 30,
    },
    timelineLine: {
        position: 'absolute',
        top: 30,
        width: 1,
        left: 14.5,
        backgroundColor: Colors.light.border,
    },
    iconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.card,
        backgroundColor: Colors.light.card,
        shadowColor: Colors.light.icon,
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        zIndex: 1,
    },
    cardWrapper: {
        flex: 1,
    },
    txnCard: {
        backgroundColor: Colors.light.card,
        borderRadius: 16,
        padding: 16,
        shadowColor: Colors.light.icon,
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    txnHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    txnDate: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 4,
    },
    txnId: {
        fontSize: 12,
        color: Colors.light.icon,
        flexShrink: 1,
        maxWidth: 200,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        letterSpacing: 0.5,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    txnDesc: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    txnAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.error,
        marginBottom: 16,
    },
    cardFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        alignItems: 'flex-start',
    },
});
