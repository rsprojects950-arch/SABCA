import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../ctx/AuthContext';
import { useTheme } from '../../ctx/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import { signQRCode } from '../../utils/crypto_utils';

const { width } = Dimensions.get('window');

export default function QRAccessScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors } = useTheme();
    const [qrValue, setQrValue] = useState('Loading...');
    const [membershipId, setMembershipId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchProfileData();
        }
    }, [user]);

    const fetchProfileData = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, membership_id, sabca_id, status, valid_until')
                .eq('id', user!.id)
                .single();

            const p: any = data || {};
            const name = p.full_name || 'Member';
            const mid = p.sabca_id || 'PENDING';
            const status = p.status || 'Active';

            // Format for generic scanners to be readable
            const sig = signQRCode(mid, user!.id, status);
            const readableString = `SABCA MEMBER PASS\n\nName: ${name}\nID: ${mid}\nStatus: ${status}\nUID: ${user!.id.substring(0, 8)}\nSIG: ${sig}`;

            setQrValue(readableString);
            setMembershipId(mid);
        } catch (e) {
            console.error(e);
            setQrValue('Error loading ID');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <LinearGradient
                colors={['#1E293B', '#0F172A']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>QR Access</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.card}>
                    <LinearGradient
                        colors={[colors.card, colors.card]}
                        style={styles.cardGradient}
                    >
                        <View style={styles.qrHeader}>
                            <Text style={[styles.accessTitle, { color: colors.text }]}>Member Access</Text>
                            <View style={styles.verifiedBadge}>
                                <ShieldCheck size={14} color="#10B981" />
                                <Text style={styles.verifiedText}>Active</Text>
                            </View>
                        </View>

                        <View style={styles.qrWrapper}>
                            {!loading ? (
                                <QRCode
                                    value={qrValue}
                                    size={200}
                                    color="black"
                                    backgroundColor="white"
                                />
                            ) : (
                                <Text>Loading...</Text>
                            )}
                        </View>

                        <Text style={[styles.memberIdText, { color: colors.text }]}>
                            {membershipId || 'Generating ID...'}
                        </Text>
                    </LinearGradient>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 350,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    cardGradient: {
        padding: 30,
        alignItems: 'center',
    },
    qrHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    accessTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    verifiedText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    qrWrapper: {
        padding: 20,
        backgroundColor: '#FFF',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 20,
    },
    memberIdText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 8,
        fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    },
});
