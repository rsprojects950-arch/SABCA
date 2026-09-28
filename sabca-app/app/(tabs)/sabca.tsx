import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator, Modal, RefreshControl, ScrollView, Alert, TextInput, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, Mail, MapPin, Users, Briefcase, Handshake, Bell, Crown, X, Globe, ChevronRight, ShieldAlert, User, Building2 } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { MemberCardSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../ctx/AuthContext';
import { useTheme } from '../../ctx/ThemeContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useHaptics } from '../../hooks/useHaptics';

// --- Static Data for Partners ---
const PARTNERS = [
    { id: '1', name: 'InfraXpert', url: 'https://infraxpert.in/' },
];

const DIVISION_REG_NUMBERS: Record<string, string> = {
    'Tirupati (SABCA-TPT)': '104 of 2025',
    'Ananthapuramu (SABCA-CWA-ATP)': '339 of 2018',
    'Kurnool (SABCA-KNL)': '63 of 2020',
    'Nellore (SABCA-NLR)': 'N/A',
    'Guntur Prakasam (SABCA-SGP)': '4 of 2020',
    'Krishna (SABCA-KRN)': '393 of 2019',
    'Guntur Nagarapalaka Samata (SABCA-GMCA)': '410 of 19',
    'Eluru West Godavari (SABCA-ELWG)': '265 of 2024',
    'East Godavari (SABCA-EGD)': '41 of 2024',
    'Kakinada & Konaseema (SABCA-KKCA)': '527 of 2024',
    'Visakha (SABCA-VSP)': 'N/A',
    'Greater Visakha (SABCA-GVMC-CWA)': 'N/A',
    'Vizianagaram (SABCA-RCA-VZMD)': '269 of 2014',
    'Srikakulam (SABCA-SKLM)': '242',
    'Vizianagaram Municipal (SABCA-VZM-CWA)': 'N/A',
    'Mangalagiri Tadepalli (SABCA-MTMC)': '208 of 2025',
};

const formatDivisionDisplay = (name?: string) => {
    if (!name) return '';
    if (name.includes('Head Office') || name === 'SABCA State Office') return 'SABCA State Office';
    // Remove obsolete override logic if any, but ensure brand consistency


    const regNo = DIVISION_REG_NUMBERS[name] || 'N/A';
    const match = name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
        return `${match[1].trim()} (${regNo}, ${match[2].trim()})`;
    }
    return `${name} (${regNo})`;
};

const PAGE_SIZE = 20;

export default function SabcaScreen() {
    const router = useRouter();
    const { user, isMembershipActive } = useAuth();
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [division, setDivision] = useState<any>(null);
    const { lightImpact, selectionFeedback } = useHaptics();

    // Committee State
    const [selectedCommitteeTab, setSelectedCommitteeTab] = useState<'State' | 'Division' | 'Divisions'>('State');
    const [stateCommittee, setStateCommittee] = useState<any[]>([]);
    const [divisionLeaders, setDivisionLeaders] = useState<any[]>([]);
    const [allDivisions, setAllDivisions] = useState<any[]>([]);
    const [goCount, setGoCount] = useState(0);

    // Members Modal
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersPage, setMembersPage] = useState(0);
    const [hasMoreMembers, setHasMoreMembers] = useState(true);
    // Debounce search
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');


    // Partners Modal
    const [partnersModalVisible, setPartnersModalVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useFocusEffect(
        useCallback(() => {
            refetchDivision();
        }, [])
    );

    // Reset pagination when modal opens or search changes
    useEffect(() => {
        if (modalVisible) {
            setMembersPage(0);
            setAllMembers([]);
            fetchDivisionMembers(0, debouncedSearchQuery, true);
        }
    }, [modalVisible, debouncedSearchQuery]);


    // React Query for Division and Committee Data
    const { data: divisionData, isLoading: divisionLoading, refetch: refetchDivision } = useQuery({
        queryKey: ['my_division', user?.id],
        queryFn: async () => {
            if (!user) return null;

            // 1. Get User's Division
            const { data: profile } = await supabase
                .from('profiles')
                .select('division')
                .eq('id', user.id)
                .single();

            if (!profile?.division) return null;

            const divisionName = profile.division;

            // Parallel Queries
            const [
                divisionInfo,
                memberCount,
                divLeaders,
                stateMembers,
                goCountResult,
                allDivsResult
            ] = await Promise.all([
                // Division Metadata
                supabase.from('divisions').select('id, name').eq('name', divisionName).maybeSingle(),

                // Member Count
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('division', divisionName),

                // Division Leaders
                supabase.from('profiles')
                    .select('id, full_name, avatar_url, phone, email, designation, division_rank, committee_role, division')
                    .eq('division', divisionName)
                    .gt('division_rank', 0)
                    .or('committee_role.eq.Division,committee_role.is.null')
                    .order('division_rank', { ascending: true }),

                // State Committee
                supabase.from('profiles')
                    .select('id, full_name, avatar_url, phone, email, designation, division_rank, committee_role, division')
                    .eq('committee_role', 'State')
                    .gt('division_rank', 0)
                    .order('division_rank', { ascending: true }),

                // GO Count
                supabase.from('government_orders').select('*', { count: 'exact', head: true }),

                // All Divisions for our new tab
                supabase.from('divisions').select('id, name').order('id', { ascending: true })
            ]);

            // Filter out 'SABCA State Office' and sort divisions
            let sortedDivs = (allDivsResult.data || []).filter(d => d.name !== 'SABCA State Office');
            
            if (sortedDivs.length > 0) {
                const gunturPrakasamIndex = sortedDivs.findIndex(d => d.id === 5);
                const gunturNagarapalakaIndex = sortedDivs.findIndex(d => d.id === 7);
                
                if (gunturPrakasamIndex !== -1 && gunturNagarapalakaIndex !== -1) {
                    const [nagarapalaka] = sortedDivs.splice(gunturNagarapalakaIndex, 1);
                    // Re-calculate index after splice
                    const newPrakasamIndex = sortedDivs.findIndex(d => d.id === 5);
                    sortedDivs.splice(newPrakasamIndex + 1, 0, nagarapalaka);
                }
            }

            return {
                division: {
                    ...(divisionInfo.data || { name: divisionName }),
                    member_count: memberCount.count || 0
                },
                divisionLeaders: divLeaders.data || [],
                stateCommittee: stateMembers.data || [],
                allDivisions: sortedDivs,
                goCount: goCountResult.count || 0
            };
        },
        enabled: !!user,
    });

    useEffect(() => {
        if (divisionData) {
            setDivision(divisionData.division);
            setDivisionLeaders(divisionData.divisionLeaders);
            setStateCommittee(divisionData.stateCommittee);
            setAllDivisions(divisionData.allDivisions);
            setGoCount(divisionData.goCount);
            setLoading(false);
        }
    }, [divisionData]);

    const fetchDivisionMembers = async (page: number, query: string, refresh: boolean = false) => {
        if (!division?.name) return;
        if (membersLoading) return;

        setMembersLoading(true);

        try {
            let queryBuilder = supabase
                .from('profiles')
                .select('id, full_name, avatar_url, phone, email, designation') // Optimize columns
                .eq('division', division.name)
                .not('full_name', 'is', null); // Ensure name exists

            if (query) {
                // ILIKE for case-insensitive search
                queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`);
            }

            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await queryBuilder
                .range(from, to)
                .order('full_name', { ascending: true });

            if (error) throw error;

            if (data) {
                if (refresh) {
                    setAllMembers(data);
                } else {
                    setAllMembers(prev => [...prev, ...data]);
                }
                setHasMoreMembers(data.length === PAGE_SIZE);
                setMembersPage(page + 1);
            }
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), 'Failed to load members.');
        } finally {
            setMembersLoading(false);
        }
    };

    const loadMoreMembers = () => {
        if (!membersLoading && hasMoreMembers) {
            fetchDivisionMembers(membersPage, debouncedSearchQuery);
        }
    };




    const handleEmail = (email: string) => {
        if (!email) return;
        Linking.openURL(`mailto:${email}`);
    };

    const onRefresh = () => {
        setRefreshing(true);
        refetchDivision().then(() => setRefreshing(false));
    };

    const renderTeamMember = ({ item }: { item: any }) => (
        <LinearGradient
            colors={isDark ? ['rgba(229, 57, 53, 0.2)', 'rgba(142, 68, 173, 0.2)'] : Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradientBorder}
        >
            <View style={[styles.card, { backgroundColor: colors.card, paddingVertical: 12 }]}>
                <View style={[styles.cardHeader, { marginBottom: 0 }]}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                        {item.avatar_url ? (
                            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                        ) : (
                            <User size={24} color={colors.primary} />
                        )}
                    </View>
                    <View style={styles.info}>
                        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.full_name}</Text>
                        <Text style={[styles.role, { color: isDark ? '#F87171' : '#B91C1C', fontWeight: '600' }]} numberOfLines={1}>
                            {item.committee_role === 'State' ? item.designation : (item.designation || t('sabca.member'))}
                        </Text>
                    </View>

                    {/* Email button on the right */}
                    {(() => {
                        const isStateMember = item.committee_role === 'State';
                        // Only override for leaders (division_rank > 0)
                        const isLeader = item.division_rank > 0;
                        const contactEmail = isStateMember
                            ? 'sabca0019@gmail.com'
                            : (isLeader && division?.email && item.division === division.name)
                                ? division.email
                                : item.email;

                        if (!contactEmail) return null;

                        return (
                            <TouchableOpacity
                                onPress={() => {
                                    lightImpact();
                                    handleEmail(contactEmail);
                                }}
                                style={styles.contactBtn}
                            >
                                <View style={[styles.iconGradient, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9', width: 36, height: 36 }]}>
                                    <Mail size={16} color={colors.text} />
                                </View>
                            </TouchableOpacity>
                        );
                    })()}
                </View>
            </View>
        </LinearGradient>
    );

    const renderDivisionListItem = ({ name }: { name: string }) => (
        <View style={[styles.divisionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconGradient, { backgroundColor: colors.primary + '10', width: 40, height: 40 }]}>
                <Building2 size={20} color={colors.primary} />
            </View>
            <Text style={[styles.divisionName, { color: colors.text }]}>{formatDivisionDisplay(name)}</Text>
        </View>
    );

    const renderModalListItem = ({ item }: { item: any }) => (
        <View style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.listInfo}>
                <Text style={[styles.listName, { color: colors.text }]}>{item.full_name}</Text>
            </View>
            <View style={styles.listContactRow}>

                {item.email && (
                    <TouchableOpacity
                        onPress={() => {
                            lightImpact();
                            handleEmail(item.email);
                        }}
                        style={styles.contactBtn}
                    >
                        <View style={[styles.iconGradient, { width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}>
                            <Mail size={14} color={colors.text} />
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const StatCard = ({ icon: Icon, value, label, color, onPress }: any) => (
        <TouchableOpacity
            onPress={() => {
                lightImpact();
                onPress();
            }}
            activeOpacity={0.7}
            style={{ flex: 1 }}
        >
            <LinearGradient
                colors={isDark ? ['rgba(229, 57, 53, 0.1)', 'rgba(59, 130, 246, 0.1)'] : Colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradientBorder}
            >
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.statIconBox, { backgroundColor: `${color}25` }]}>
                        <Icon size={20} color={color} />
                    </View>
                    <View>
                        <Text style={[styles.statValue, { color: isDark ? '#FFF' : color }]}>{value}</Text>
                        <Text style={[styles.statLabel, { color: colors.icon }]}>{label}</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    // Get current list based on tab
    const currentList = selectedCommitteeTab === 'State' ? stateCommittee : divisionLeaders;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Header & Division Overview */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.headerLabel, { color: colors.icon }]}>{t('sabca.title')}</Text>
                        <View style={styles.locationBadge}>
                            <MapPin size={20} color={colors.primary} />
                            <Text style={[styles.headerTitle, { color: colors.text }]}>{division ? formatDivisionDisplay(division.name) : t('common.loading')}</Text>
                        </View>
                    </View>
                </View>

                {/* Stats Dashboard */}
                {division && (
                    <View style={styles.statsContainer}>
                        <StatCard
                            icon={Users}
                            value={division.member_count}
                            label={t('sabca.members')}
                            color={Colors.light.tertiary}
                            onPress={() => {
                                if (isMembershipActive) {
                                    setModalVisible(true);
                                } else {
                                    Alert.alert(
                                        t('profile.renewal.expired'),
                                        t('profile.renewal.renewDesc'),
                                        [
                                            { text: t('common.cancel'), style: "cancel" },
                                            { text: t('common.renew'), onPress: () => router.push('/member/renew') }
                                        ]
                                    );
                                }
                            }}
                        />
                        <StatCard
                            icon={Handshake}
                            value={PARTNERS.length} // Dynamic partner count
                            label={t('sabca.partners')}
                            color={Colors.light.warning}
                            onPress={() => setPartnersModalVisible(true)}
                        />
                        <StatCard
                            icon={ShieldAlert}
                            value={goCount}
                            label={t('sabca.gos')}
                            color={Colors.light.success}
                            onPress={() => router.push('/services/go-list')}
                        />
                    </View>
                )}

                {/* Committee Section with Toggle */}
                <View style={{ marginBottom: 30 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('sabca.leadershipTeam')}</Text>

                    {/* Toggle Control */}
                    <View style={[styles.toggleContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}>
                        {(['State', 'Division', 'Divisions'] as const).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.toggleBtn,
                                    selectedCommitteeTab === tab && [styles.toggleBtnActive, { backgroundColor: colors.card, shadowColor: colors.shadow }]
                                ]}
                                onPress={() => {
                                    selectionFeedback();
                                    setSelectedCommitteeTab(tab);
                                }}
                            >
                                <Text style={[
                                    styles.toggleText,
                                    selectedCommitteeTab === tab ? [styles.toggleTextActive, { color: colors.primary }] : { color: colors.icon }
                                ]}>
                                    {tab === 'Divisions' ? t('sabca.divisions') : (tab === 'Division' ? t('sabca.divLeaders') : t('sabca.stateComm'))}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* List */}
                    {loading ? (
                        <View style={{ gap: 12, paddingHorizontal: 4 }}>
                            <MemberCardSkeleton />
                            <MemberCardSkeleton />
                            <MemberCardSkeleton />
                        </View>
                    ) : selectedCommitteeTab === 'Divisions' ? (
                        <View style={{ gap: 12, paddingHorizontal: 4 }}>
                            {allDivisions.map((div) => (
                                <View key={div.id}>
                                    {renderDivisionListItem(div)}
                                </View>
                            ))}
                        </View>
                    ) : (selectedCommitteeTab === 'State' ? stateCommittee : divisionLeaders).length > 0 ? (
                        <View style={{ gap: 16, paddingHorizontal: 4 }}>
                            {(selectedCommitteeTab === 'State' ? stateCommittee : divisionLeaders).map((item) => (
                                <View key={item.id} style={{ width: '100%' }}>
                                    {renderTeamMember({ item })}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={[styles.emptyText, { color: colors.icon }]}>{t('sabca.noMembersCategory')}</Text>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Members Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('sabca.divisionMembers')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Text style={[styles.closeButtonText, { color: colors.primary }]}>{t('common.close')}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: colors.border }]}>
                                <Users size={20} color={colors.icon} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder={t('sabca.searchMembers')}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholderTextColor={colors.icon}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <X size={16} color={colors.icon} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <FlatList
                                data={allMembers}
                                renderItem={renderModalListItem}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.modalListContent}
                                onEndReached={loadMoreMembers}
                                onEndReachedThreshold={0.5}
                                ListFooterComponent={
                                    membersLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null
                                }
                                initialNumToRender={10}
                                windowSize={5}
                                maxToRenderPerBatch={5}
                                removeClippedSubviews={Platform.OS === 'android'}
                                ListEmptyComponent={
                                    membersLoading ? (
                                        <View style={{ gap: 12 }}>
                                            <MemberCardSkeleton />
                                            <MemberCardSkeleton />
                                            <MemberCardSkeleton />
                                        </View>
                                    ) : (
                                        <Text style={[styles.emptyText, { color: colors.icon }]}>{t('sabca.noMembersFound')}</Text>
                                    )
                                }
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Partners Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={partnersModalVisible}
                onRequestClose={() => setPartnersModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('sabca.ourPartners')}</Text>
                            <TouchableOpacity onPress={() => setPartnersModalVisible(false)} style={styles.closeButton}>
                                <Text style={[styles.closeButtonText, { color: colors.primary }]}>{t('common.close')}</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={PARTNERS}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.modalListContent}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => Linking.openURL(item.url)}
                                >
                                    <View style={[styles.listAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }]}>
                                        <Globe size={24} color={colors.primary} />
                                    </View>
                                    <View style={styles.listInfo}>
                                        <Text style={[styles.listName, { color: colors.text }]}>{item.name}</Text>
                                        <Text style={{ fontSize: 13, color: colors.icon }} numberOfLines={1}>{item.url}</Text>
                                    </View>
                                    <ChevronRight size={20} color={colors.icon} />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    headerLabel: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 4,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 10,
    },
    statGradientBorder: {
        flex: 1,
        borderRadius: 18,
        padding: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        gap: 8,
        width: '100%',
    },
    statIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    cardGradientBorder: {
        width: '100%',
        borderRadius: 22,
        padding: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    card: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
        textAlign: 'left',
        marginBottom: 2,
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 4,
    },
    contactBtn: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    closeButton: {
        padding: 5,
    },
    closeButtonText: {
        fontSize: 16,
        color: Colors.light.primary,
        fontWeight: '600',
    },
    modalListContent: {
        padding: 20,
        paddingBottom: 80,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    listAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 16,
        backgroundColor: '#E2E8F0',
    },
    listInfo: {
        flex: 1,
    },
    listName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 2,
    },
    listContactRow: {
        flexDirection: 'row',
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.light.text,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 10,
        color: '#94A3B8',
        fontStyle: 'italic'
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#E2E8F0',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleBtnActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    toggleText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    toggleTextActive: {
        color: Colors.light.primary,
        fontWeight: 'bold',
    },
    centerModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    centerModalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        width: '100%',
        maxHeight: '60%',
        overflow: 'hidden',
    },
    partnerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 12,
    },
    partnerIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    partnerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    partnerUrl: {
        fontSize: 12,
        color: Colors.light.primary,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    info: {
        flex: 1,
    },
    role: {
        fontSize: 14,
        textAlign: 'left',
    },
    divisionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 16,
    },
    divisionName: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
});
