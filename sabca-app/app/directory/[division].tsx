import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, Mail, MapPin } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../ctx/ThemeContext';
import { MemberCardSkeleton } from '../../components/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';
import { useHaptics } from '../../hooks/useHaptics';

export default function DirectoryDivisionScreen() {
    const { division, name } = useLocalSearchParams();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (division) fetchContacts();
    }, [division]);

    const fetchContacts = async () => {
        setLoading(true);
        // Using ilike or eq based on how division codes are saved
        const { data, error } = await supabase
            .from('directory_contacts')
            .select('*')
            .eq('division', division)
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching contacts:", error);
        } else {
            setContacts(data || []);
        }
        setLoading(false);
    };

    const handleCall = (phone: string) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone}`).catch(() => {
            Alert.alert("Error", "Could not open phone dialer");
        });
    };

    const handleEmail = (email: string) => {
        if (!email) return;
        Linking.openURL(`mailto:${email}`).catch(() => {
            Alert.alert("Error", "Could not open email client");
        });
    };

    const renderContactItem = ({ item }: { item: any }) => {
        const initial = item.name ? item.name.charAt(0).toUpperCase() : '?';

        return (
            <View style={[styles.contactCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                <View style={styles.contactHeader}>
                    <LinearGradient
                        colors={Colors.gradients.primary}
                        style={styles.avatar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.avatarText}>{initial}</Text>
                    </LinearGradient>
                    <View style={styles.contactInfo}>
                        <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.contactDesignation, { color: '#F59E0B' }]}>{item.designation}</Text>
                    </View>
                </View>

                {(item.email || item.phone || item.address) && (
                    <View style={styles.contactDetails}>
                        {item.email && (
                            <View style={styles.detailRow}>
                                <Mail size={16} color={colors.icon} />
                                <Text style={[styles.detailText, { color: colors.icon }]}>{item.email}</Text>
                            </View>
                        )}
                        {item.phone && (
                            <View style={styles.detailRow}>
                                <Phone size={16} color={colors.icon} />
                                <Text style={[styles.detailText, { color: colors.icon }]}>{item.phone}</Text>
                            </View>
                        )}
                        {item.address && (
                            <View style={styles.detailRow}>
                                <MapPin size={16} color={colors.icon} />
                                <Text style={[styles.detailText, { color: colors.icon, flex: 1 }]} numberOfLines={2}>{item.address}</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[
                            styles.actionBtn,
                            {
                                backgroundColor: isDark ? '#334155' : '#475569',
                                opacity: item.email ? 1 : 0.5,
                                borderWidth: 0
                            }
                        ]}
                        onPress={() => { lightImpact(); handleEmail(item.email); }}
                        disabled={!item.email}
                    >
                        <Mail size={16} color="#FFF" />
                        <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionBtn,
                            { padding: 0, overflow: 'hidden', opacity: item.phone ? 1 : 0.5, backgroundColor: 'transparent', borderWidth: 0 }
                        ]}
                        onPress={() => { lightImpact(); handleCall(item.phone); }}
                        disabled={!item.phone}
                    >
                        <LinearGradient
                            colors={Colors.gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: '100%' }}>
                            <Phone size={16} color="#FFF" />
                            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Call</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{name || 'Directory'}</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
                        {contacts.length} {contacts.length === 1 ? 'Contact' : 'Contacts'}
                    </Text>
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.listContent}>
                    <MemberCardSkeleton />
                    <MemberCardSkeleton />
                    <MemberCardSkeleton />
                    <MemberCardSkeleton />
                </View>
            ) : (
                <FlatList
                    data={contacts}
                    renderItem={renderContactItem}
                    keyExtractor={(item) => item.id}
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.icon }]}>No contacts found for this division.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 16,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 13,
    },
    listContent: {
        padding: 16,
    },
    contactCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    contactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    contactDesignation: {
        fontSize: 14,
        fontWeight: '600',
    },
    contactDetails: {
        marginBottom: 16,
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 12,
        gap: 8,
    },
    actionBtnText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
    }
});
