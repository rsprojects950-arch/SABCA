import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, TextInput, ActivityIndicator, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { ArrowLeft, CheckCircle, XCircle, Search, Filter, ShieldCheck, ShieldOff, Star, Briefcase, ChevronDown, ChevronUp, X, Trash2, Languages } from 'lucide-react-native';
import { PrimaryButton, SecondaryButton, DangerButton, IconButton } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../ctx/AuthContext';
import { useTheme } from '../../ctx/ThemeContext';
import { useLanguage } from '../../ctx/LanguageContext';
import { DISTRICTS, MEMBERSHIP_TYPES, District } from '../../constants/Districts';
import { useHaptics } from '../../hooks/useHaptics';


const AdminUsersScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const { language, setLanguage } = useLanguage();
    const { lightImpact, successFeedback, errorFeedback } = useHaptics();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const [currentUserDivision, setCurrentUserDivision] = useState<string | null>(null);

    // Rank Modal State
    const [rankModalVisible, setRankModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [rankInput, setRankInput] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Designation Modal State
    const [desigModalVisible, setDesigModalVisible] = useState(false);
    const [desigInput, setDesigInput] = useState('');

    // Role Selection State (State Committee vs Division Leader)
    const [selectedCommitteeRole, setSelectedCommitteeRole] = useState<'State' | 'Division'>('Division');

    // Membership Approval Modal State
    const [approvalModalVisible, setApprovalModalVisible] = useState(false);
    const [selectedDistrict, setSelectedDistrict] = useState(DISTRICTS[0]);
    const [selectedMembershipType, setSelectedMembershipType] = useState(MEMBERSHIP_TYPES[0]);
    const [validityDate, setValidityDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1))); // Default 1 year
    const [approving, setApproving] = useState(false);
    const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('5000');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    // Filter State
    const [roleFilter, setRoleFilter] = useState('All');
    const [divisionFilter, setDivisionFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);


    // Membership Approval Logic
    const openApprovalModal = (userItem: any) => {
        lightImpact();
        setSelectedUser(userItem);

        if (userItem.is_paid_member) {
            // Edit Mode: Pre-fill existing data
            const existingDistrict = DISTRICTS.find((d: District) => userItem.division === d.name) || DISTRICTS[0];
            const existingType = MEMBERSHIP_TYPES.find((t: any) => userItem.membership_type === t.value) || MEMBERSHIP_TYPES[0];

            setSelectedDistrict(existingDistrict);
            setSelectedMembershipType(existingType);

            if (userItem.membership_expiry) {
                setValidityDate(new Date(userItem.membership_expiry));
            } else {
                setValidityDate(new Date());
            }
        } else {
            // New Approval: Default data
            setSelectedDistrict(DISTRICTS[0]);
            setSelectedMembershipType(MEMBERSHIP_TYPES[0]);
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            setValidityDate(nextYear);
        }

        setApprovalModalVisible(true);
    };

    const confirmApproval = async () => {
        if (!selectedUser) return;
        setApproving(true);

        try {
            // Adjust validity based on type if needed AND if it wasn't manually changed (simplification: just use date picker value)
            let finalValidity = validityDate;

            const { data, error } = await supabase.rpc('approve_membership', {
                target_user_id: selectedUser.id,
                district_code: selectedDistrict.code,
                district_name: selectedDistrict.name,
                membership_type_code: selectedMembershipType.code,
                membership_type_label: selectedMembershipType.value,
                validity_date: finalValidity.toISOString(),
                payment_amount: parseFloat(paymentAmount) || 5000,
                payment_method: paymentMethod
            });

            if (error) throw error;

            successFeedback();
            const action = selectedUser.is_paid_member ? t('common.updated') : t('common.approved');
            Alert.alert(t('common.success'), `Membership ${action}!\nID: ${data.sabca_id}`);
            setApprovalModalVisible(false);
            fetchUsers();
        } catch (error: any) {
            errorFeedback();
            Alert.alert(t('common.error'), error.message);
        } finally {
            setApproving(false);
        }
    };

    const openDesigModal = (userItem: any) => {
        lightImpact();
        setSelectedUser(userItem);
        setDesigInput(userItem.designation || '');
        setDesigModalVisible(true);
    };

    const saveDesignation = async () => {
        if (!selectedUser) return;
        const { error } = await supabase.rpc('set_user_designation', {
            target_user_id: selectedUser.id,
            new_designation: desigInput
        });

        if (error) {
            errorFeedback();
            Alert.alert(t('common.error'), error.message);
        } else {
            successFeedback();
            setDesigModalVisible(false);
            fetchUsers();
            Alert.alert(t('common.success'), 'Designation updated');
        }
    };

    const handleDeleteUser = async (userToDelete: any) => {
        Alert.alert(
            t('common.delete'),
            `Are you sure you want to delete ${userToDelete.full_name}? This action is permanent and will remove ALL associated data (grievances, transactions, etc.).`,
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);

                            // Get token explicitly to ensure it's sent
                            const { data: { session } } = await supabase.auth.getSession();

                            const { data, error } = await supabase.functions.invoke('delete-user', {
                                body: { target_user_id: userToDelete.id },
                                headers: {
                                    Authorization: `Bearer ${session?.access_token}`
                                }
                            });


                            // Due to our debugging workaround, the Edge Function returns 200 OK even on failure,
                            // but embeds the error in the `data` payload. We must check both.
                            if (error || data?.error) {
                                let errorMsg = 'Failed to delete user';

                                if (data?.error) {
                                    console.log('Edge Function Warning Payload:', data);
                                    errorMsg = data.details || data.error;
                                    if (data.authError) errorMsg += `\nAuth: ${JSON.stringify(data.authError)}`;
                                    if (data.profileError) errorMsg += `\nProfile: ${JSON.stringify(data.profileError)}`;
                                    if (data.rpcError) errorMsg += `\nRPC: ${JSON.stringify(data.rpcError)}`;
                                    if (data.available_tables) errorMsg += `\nTables: ${data.available_tables.length}`;
                                } else if (error) {
                                    console.log('Edge Function HTTP Error:', error);
                                    if (error.context?.response) {
                                        try {
                                            const errorData = await error.context.response.json();
                                            errorMsg = errorData.details || errorData.error || errorMsg;
                                        } catch (e) {
                                            errorMsg = `Status ${error.context.response.status}: ${error.message}`;
                                        }
                                    } else {
                                        errorMsg = error.message || errorMsg;
                                        if ((error as any).details) errorMsg += `\nDetails: ${(error as any).details}`;
                                        if ((error as any).hint) errorMsg += `\nHint: ${(error as any).hint}`;
                                    }
                                }
                                throw new Error(errorMsg);
                            }

                            Alert.alert('Success', 'User and all data deleted successfully.');
                            fetchUsers();
                        } catch (error: any) {
                            Alert.alert('Deletion Failed', error.message || 'An unexpected error occurred');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        checkMyRole();
        fetchUsers();
    }, []);

    const checkMyRole = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('role, division').eq('id', user.id).single();
        setCurrentUserRole(data?.role);
        setCurrentUserDivision(data?.division);
    };

    const fetchUsers = async () => {
        setLoading(true);
        let query = supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url, role, division, division_rank, committee_role, designation, is_paid_member, contractor_class, sabca_id, created_at')
            .order('created_at', { ascending: false });

        // If moderator, only show their division
        const { data: me } = await supabase.from('profiles').select('role, division').eq('id', user?.id).single();

        if (me?.role === 'moderator') {
            if (me?.division) {
                query = query.eq('division', me.division);
            } else {
                // If moderator has no division, they shouldn't see anyone (except themselves)
                query = query.eq('id', user?.id);
            }
        }

        const { data, error } = await query;

        if (error) {
            Alert.alert(t('common.error'), 'Failed to fetch users');
        } else {
            setUsers(data || []);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const handleRoleUpdate = async (userId: string, currentRole: string, userName: string) => {
        const isModerator = currentRole === 'moderator';
        const newRole = isModerator ? 'member' : 'moderator';
        const actionText = isModerator ? 'Demote to Member' : 'Promote to Moderator';

        Alert.alert(
            t('admin.users.confirmRoleChange'),
            `Are you sure you want to ${actionText} for ${userName}?`,
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.confirm'),
                    onPress: async () => {
                        const { data, error } = await supabase.rpc('set_user_role', {
                            target_user_id: userId,
                            new_role: newRole
                        });

                        if (error) {
                            errorFeedback();
                            Alert.alert(t('common.error'), error.message);
                        } else {
                            successFeedback();
                            Alert.alert(t('common.success'), `User role updated to ${newRole}`);
                            fetchUsers(); // Refresh list
                        }
                    }
                }
            ]
        );
    };

    const openRankModal = (userItem: any) => {
        lightImpact();
        setSelectedUser(userItem);
        setRankInput(userItem.division_rank > 0 ? userItem.division_rank.toString() : '');
        // Default to existing role or 'Division'
        const existingRole = userItem.committee_role;
        setSelectedCommitteeRole(existingRole === 'State' ? existingRole : 'Division');
        setDropdownOpen(false);
        setRankModalVisible(true);
    };

    const saveRank = async () => {
        if (!selectedUser) return;

        const rank = parseInt(rankInput || '0', 10);
        if (isNaN(rank) || rank < 0 || rank > 50) {
            errorFeedback();
            Alert.alert('Invalid Input', 'Rank must be a number between 0 and 50.');
            return;
        }

        // Use the new RPC that sets both Rank and Committee Role
        const { error } = await supabase.rpc('set_user_rank_and_role', {
            target_user_id: selectedUser.id,
            new_rank: rank,
            new_role: selectedCommitteeRole
        });

        if (error) {
            // Fallback for backward compatibility if RPC doesn't exist yet (though it should)
            console.error("RPC Error, updating rank only:", error);
            const { error: rankError } = await supabase.rpc('set_user_rank', {
                target_user_id: selectedUser.id,
                new_rank: rank
            });
            if (rankError) {
                errorFeedback();
                Alert.alert('Error', rankError.message);
            } else {
                successFeedback();
                setRankModalVisible(false);
                fetchUsers();
                Alert.alert('Success', 'Rank updated (Role update failed)');
            }
        } else {
            successFeedback();
            setRankModalVisible(false);
            fetchUsers();
            Alert.alert('Success', rank > 0 ? `Rank #${rank} assigned to ${selectedCommitteeRole} Committee` : 'Rank removed');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'All' || user.role === roleFilter;

        const matchesDivision = divisionFilter === 'All' || user.division === divisionFilter;

        return matchesSearch && matchesRole && matchesDivision;
    });


    const renderUserItem = ({ item }: { item: any }) => (
        <View style={[styles.userCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.userHeader}>
                <Image source={{ uri: item.avatar_url || 'https://i.pravatar.cc/150?img=12' }} style={[styles.avatar, { backgroundColor: colors.background }]} />
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{item.full_name || 'No Name'}</Text>
                    <Text style={[styles.userEmail, { color: colors.icon }]}>{item.email}</Text>
                    {item.designation ? <Text style={[styles.userDesignation, { color: colors.text, opacity: 0.7 }]}>{item.designation}</Text> : null}
                </View>
                {/* Action Buttons - Absolute positioned or flex-end */}
                <View style={styles.actions}>
                    {(currentUserRole === 'admin' || currentUserRole === 'moderator') && item.role !== 'admin' && (
                        <IconButton
                            icon={<Star size={20} color={item.division_rank > 0 ? "#F59E0B" : "#CBD5E1"} fill={item.division_rank > 0 ? "#F59E0B" : "none"} />}
                            onPress={() => openRankModal(item)}
                            size={40}
                            backgroundColor={colors.background}
                            style={{ borderRadius: 8, borderColor: colors.border, borderWidth: 1 }}
                        />
                    )}

                    {(currentUserRole === 'admin' || currentUserRole === 'moderator') && item.role !== 'admin' && (
                        <IconButton
                            icon={item.role === 'moderator' ? <ShieldOff size={20} color={colors.error} /> : <ShieldCheck size={20} color={colors.success} />}
                            onPress={() => handleRoleUpdate(item.id, item.role, item.full_name)}
                            size={40}
                            backgroundColor={colors.background}
                            style={{ borderRadius: 8, borderColor: colors.border, borderWidth: 1 }}
                        />
                    )}

                    {(currentUserRole === 'admin' || currentUserRole === 'moderator') && (
                        <IconButton
                            icon={<Briefcase size={18} color={colors.primary} />}
                            onPress={() => openDesigModal(item)}
                            size={40}
                            backgroundColor={colors.background}
                            style={{ borderRadius: 8, borderColor: colors.border, borderWidth: 1 }}
                        />
                    )}

                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                <View style={[styles.badgesRow, { flex: 1 }]}>
                    {/* Rank Badge */}
                    {item.division_rank > 0 && (
                        <View style={[styles.rankBadge, item.committee_role === 'State' ? { borderColor: '#FECACA', backgroundColor: '#FEF2F2' } : item.committee_role === 'Ex-Official' ? { borderColor: '#E9D5FF', backgroundColor: '#FAF5FF' } : {}]}>
                            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/616/616490.png' }} style={{ width: 14, height: 14 }} />
                            <Text style={[styles.rankText, item.committee_role === 'State' ? { color: '#DC2626' } : item.committee_role === 'Ex-Official' ? { color: '#7C3AED' } : {}]}>
                                #{item.division_rank} {item.committee_role === 'State' ? '(State)' : item.committee_role === 'Ex-Official' ? '(Ex-Off.)' : ''}
                            </Text>
                        </View>
                    )}

                    {/* Role Badge */}
                    <View style={[styles.badge, (item.role === 'admin' || item.role === 'moderator') ? styles.badgeAdmin : styles.badgeMember]}>
                        <Text style={[styles.badgeText, (item.role === 'admin' || item.role === 'moderator') ? styles.badgeTextAdmin : styles.badgeTextMember]}>
                            {item.role?.toUpperCase() || 'MEMBER'}
                        </Text>
                    </View>

                    {/* Status Badge */}
                    <TouchableOpacity onPress={() => openApprovalModal(item)}>
                        {item.is_paid_member ? (
                            <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
                                <Text style={[styles.badgeText, { color: '#16A34A' }]}>PAID</Text>
                            </View>
                        ) : (
                            <View style={[styles.badge, { backgroundColor: '#FECACA' }]}>
                                <Text style={[styles.badgeText, { color: '#DC2626' }]}>PENDING</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Contractor Class Badge */}
                    {item.contractor_class && (
                        <View style={[styles.badge, { backgroundColor: '#E0E7FF' }]}>
                            <Text style={[styles.badgeText, { color: '#4338CA' }]}>{item.contractor_class}</Text>
                        </View>
                    )}

                    {/* Show ID if exists */}
                    {item.sabca_id && (
                        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4, width: '100%', fontWeight: '500' }}>
                            ID: {item.sabca_id}
                        </Text>
                    )}
                </View>

                {currentUserRole === 'admin' && item.id !== user?.id && (
                    <TouchableOpacity
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(239, 68, 68, 0.2)',
                        }}
                        onPress={() => handleDeleteUser(item)}
                    >
                        <Trash2 size={18} color={'#EF4444'} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('admin.users.title')}</Text>

                <TouchableOpacity
                    style={[styles.langToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => { lightImpact(); setLanguage(language === 'en' ? 'te' : 'en'); }}
                >
                    <Text style={[styles.langText, { color: colors.text }]}>
                        {language === 'en' ? 'తెలుగు' : 'EN'}
                    </Text>
                    <Languages size={18} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Search & Filter Bar */}
            <View style={styles.filterSection}>
                <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border, flex: 1, margin: 0 }]}>
                    <Search size={20} color={colors.icon} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder={t('admin.users.searchPlaceholder')}
                        placeholderTextColor={colors.icon}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => { lightImpact(); setSearchQuery(''); }}>
                            <X size={18} color={colors.icon} />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.filterBtnContainer}
                    onPress={() => { lightImpact(); setShowFilters(!showFilters); }}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={Colors.gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.filterBtnGradient}
                    >
                        <Filter size={20} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>



            </View>



            {/* Expanded Filters */}
            {showFilters && (
                <View style={[styles.expandedFilters, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <View style={styles.filterRow}>
                        {/* Role Filter */}
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.filterLabel, { color: colors.icon }]}>{t('admin.users.role')}</Text>
                            <TouchableOpacity
                                style={[styles.filterDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => {
                                    lightImpact();
                                    setShowRoleDropdown(!showRoleDropdown);
                                    setShowDivisionDropdown(false);
                                }}
                            >
                                <Text style={[styles.filterDropdownText, { color: colors.text }]}>
                                    {roleFilter === 'All' ? t('admin.users.allRoles') : roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
                                </Text>
                                <ChevronDown size={16} color={colors.icon} />
                            </TouchableOpacity>
                        </View>

                        {/* Division Filter */}
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.filterLabel, { color: colors.icon }]}>Division</Text>
                            <TouchableOpacity
                                style={[styles.filterDropdown, { backgroundColor: colors.background, borderColor: colors.border }, currentUserRole === 'moderator' && { opacity: 0.6 }]}
                                onPress={() => {
                                    if (currentUserRole === 'admin') {
                                        lightImpact();
                                        setShowDivisionDropdown(!showDivisionDropdown);
                                        setShowRoleDropdown(false);
                                    } else {
                                        errorFeedback();
                                        Alert.alert(t('common.info'), t('admin.users.modInfo'));
                                    }
                                }}
                            >
                                <Text style={[styles.filterDropdownText, { color: colors.text }]} numberOfLines={1}>
                                    {currentUserRole === 'moderator' ? (currentUserDivision || 'Your Division') : (divisionFilter === 'All' ? t('admin.users.allDivisions') : divisionFilter)}
                                </Text>
                                {currentUserRole === 'admin' && <ChevronDown size={16} color={colors.icon} />}
                            </TouchableOpacity>
                        </View>
                    </View>


                    {(roleFilter !== 'All' || divisionFilter !== 'All') && (
                        <TouchableOpacity
                            style={styles.clearFiltersBtn}
                            onPress={() => {
                                lightImpact();
                                setRoleFilter('All');
                                setDivisionFilter('All');
                            }}
                        >
                            <Text style={[styles.clearFiltersText, { color: colors.primary }]}>{t('buttons.clearFilters')}</Text>
                        </TouchableOpacity>
                    )}

                </View>
            )}

            {/* Role Dropdown Modal */}
            <Modal
                visible={showRoleDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowRoleDropdown(false)}
            >
                <TouchableOpacity
                    style={styles.dropdownModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowRoleDropdown(false)}
                >
                    <View style={[styles.inlineDropdown, { top: 215, left: 20, width: 160, backgroundColor: colors.card, borderColor: colors.border }]}>
                        {['All', 'admin', 'moderator', 'member'].map((role) => (
                            <TouchableOpacity
                                key={role}
                                style={styles.inlineDropdownItem}
                                onPress={() => {
                                    lightImpact();
                                    setRoleFilter(role);
                                    setShowRoleDropdown(false);
                                }}
                            >
                                <Text style={[styles.inlineDropdownText, { color: roleFilter === role ? colors.primary : colors.text }]}>
                                    {role === 'All' ? t('admin.users.allRoles') : role.charAt(0).toUpperCase() + role.slice(1)}
                                </Text>
                                {roleFilter === role && <CheckCircle size={14} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Division Dropdown Modal */}
            <Modal
                visible={showDivisionDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDivisionDropdown(false)}
            >
                <TouchableOpacity
                    style={styles.dropdownModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDivisionDropdown(false)}
                >
                    <View style={[styles.inlineDropdown, { top: 215, right: 20, width: 280, backgroundColor: colors.card, borderColor: colors.border }]}>
                        <FlatList
                            data={[{ code: 'All', name: 'All Divisions' }, ...DISTRICTS]}
                            keyExtractor={(item) => item.code}
                            style={{ maxHeight: 400 }}
                            nestedScrollEnabled={true}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.inlineDropdownItem}
                                    onPress={() => {
                                        lightImpact();
                                        setDivisionFilter(item.name === 'All Divisions' ? 'All' : item.name);
                                        setShowDivisionDropdown(false);
                                    }}
                                >
                                    <Text style={[styles.inlineDropdownText, { color: (divisionFilter === 'All' && item.code === 'All') || divisionFilter === item.name ? colors.primary : colors.text }]} numberOfLines={1}>
                                        {item.name === 'All Divisions' ? t('admin.users.allDivisions') : item.name}
                                    </Text>
                                    {((divisionFilter === 'All' && item.code === 'All') || divisionFilter === item.name) && <CheckCircle size={14} color={colors.primary} />}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.5 }} />}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>


            <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { lightImpact(); setRefreshing(true); fetchUsers(); }} />}
                ListEmptyComponent={
                    !loading ? (
                        <Text style={{ textAlign: 'center', marginTop: 40, color: colors.icon }}>{t('common.none')}</Text>
                    ) : (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                    )
                }
            />

            {/* Rank Input Modal */}
            <Modal
                visible={rankModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setRankModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('admin.users.setRank')}</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
                            {t('admin.users.rankDesc')} for {selectedUser?.full_name}.
                        </Text>

                        <TextInput
                            style={[styles.rankInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Rank (0-10)"
                            value={rankInput}
                            onChangeText={setRankInput}
                            keyboardType="number-pad"
                            maxLength={2}
                            autoFocus
                            placeholderTextColor={colors.icon}
                        />

                        {/* Committee Role Selector */}
                        <View style={styles.roleSelector}>
                            <Text style={[styles.roleLabel, { color: colors.text }]}>Assign To:</Text>
                            <View style={{ zIndex: 1000 }}>
                                <TouchableOpacity
                                    style={[styles.dropdownBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => { lightImpact(); setDropdownOpen(!dropdownOpen); }}
                                >
                                    <Text style={[styles.dropdownBtnText, { color: colors.text }]}>
                                        {selectedCommitteeRole === 'State' ? t('admin.users.stateCommittee') : t('admin.users.divisionLeader')}
                                    </Text>
                                    {dropdownOpen ? <ChevronUp size={20} color={colors.icon} /> : <ChevronDown size={20} color={colors.icon} />}
                                </TouchableOpacity>

                                {dropdownOpen && (
                                    <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <TouchableOpacity
                                            style={[styles.dropdownItem, { backgroundColor: colors.card }]}
                                            onPress={() => {
                                                lightImpact();
                                                setSelectedCommitteeRole('State');
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            <Text style={[styles.dropdownItemText, { color: colors.text }]}>{t('admin.users.stateCommittee')}</Text>
                                            {selectedCommitteeRole === 'State' && <CheckCircle size={16} color={colors.primary} />}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.dropdownItem, { backgroundColor: colors.card }]}
                                            onPress={() => {
                                                lightImpact();
                                                setSelectedCommitteeRole('Division');
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            <Text style={[styles.dropdownItemText, { color: colors.text }]}>{t('admin.users.divisionLeader')}</Text>
                                            {selectedCommitteeRole === 'Division' && <CheckCircle size={16} color={colors.primary} />}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <SecondaryButton
                                title={t('common.cancel')}
                                onPress={() => { lightImpact(); setRankModalVisible(false); }}
                                style={{ flex: 1, backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }}
                                textStyle={{ color: colors.text }}
                            />

                            <PrimaryButton
                                title={t('admin.users.saveRank')}
                                onPress={saveRank}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Membership Approval Modal */}
            <Modal
                visible={approvalModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => { lightImpact(); setApprovalModalVisible(false); }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => { lightImpact(); setApprovalModalVisible(false); }}
                        >
                            <ArrowLeft size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {selectedUser?.is_paid_member ? t('admin.users.updateMembership') : t('admin.users.approveMembership')}
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
                            {selectedUser?.is_paid_member ? t('common.edit') : t('admin.users.membershipSubtitle')} for {selectedUser?.full_name}
                        </Text>

                        {/* District Selector */}
                        <View style={styles.roleSelector}>
                            <Text style={[styles.roleLabel, { color: colors.text }]}>{t('admin.users.selectDistrict')}</Text>
                            <View style={{ zIndex: 3000 }}>
                                <TouchableOpacity
                                    style={[styles.dropdownBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => {
                                        lightImpact();
                                        setShowDistrictDropdown(!showDistrictDropdown);
                                        setShowTypeDropdown(false);
                                    }}
                                >
                                    <Text style={[styles.dropdownBtnText, { color: colors.text }]} numberOfLines={1}>
                                        {selectedDistrict.name}
                                    </Text>
                                    {showDistrictDropdown ? <ChevronUp size={20} color={colors.icon} /> : <ChevronDown size={20} color={colors.icon} />}
                                </TouchableOpacity>

                                {showDistrictDropdown && (
                                    <View style={[styles.dropdownList, { maxHeight: 200, backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                            {DISTRICTS.map((item: District) => (
                                                <React.Fragment key={item.code}>
                                                    <TouchableOpacity
                                                        style={[styles.dropdownItem, { backgroundColor: colors.card }]}
                                                        onPress={() => {
                                                            lightImpact();
                                                            setSelectedDistrict(item);
                                                            setShowDistrictDropdown(false);
                                                        }}
                                                    >
                                                        <Text style={[styles.dropdownItemText, { color: colors.text }]}>{item.name}</Text>
                                                        {selectedDistrict.code === item.code && <CheckCircle size={16} color={colors.primary} />}
                                                    </TouchableOpacity>
                                                    <View style={[styles.dropdownDivider, { backgroundColor: colors.border }]} />
                                                </React.Fragment>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Membership Type Selector */}
                        <View style={[styles.roleSelector, { zIndex: 2000 }]}>
                            <Text style={[styles.roleLabel, { color: colors.text }]}>{t('admin.users.membershipType')}</Text>
                            <View>
                                <TouchableOpacity
                                    style={[styles.dropdownBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => {
                                        lightImpact();
                                        setShowTypeDropdown(!showTypeDropdown);
                                        setShowDistrictDropdown(false);
                                    }}
                                >
                                    <Text style={[styles.dropdownBtnText, { color: colors.text }]}>
                                        {selectedMembershipType.label}
                                    </Text>
                                    {showTypeDropdown ? <ChevronUp size={20} color={colors.icon} /> : <ChevronDown size={20} color={colors.icon} />}
                                </TouchableOpacity>

                                {showTypeDropdown && (
                                    <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        {MEMBERSHIP_TYPES.map((item: any) => (
                                            <TouchableOpacity
                                                key={item.code}
                                                style={[styles.dropdownItem, { backgroundColor: colors.card }]}
                                                onPress={() => {
                                                    lightImpact();
                                                    setSelectedMembershipType(item);
                                                    setShowTypeDropdown(false);
                                                    if (!selectedUser?.is_paid_member) {
                                                        const d = new Date();
                                                        if (item.value === 'Life') d.setFullYear(d.getFullYear() + 100);
                                                        else d.setFullYear(d.getFullYear() + 1);
                                                        setValidityDate(d);
                                                    }
                                                }}
                                            >
                                                <Text style={[styles.dropdownItemText, { color: item.color }]}>{item.label}</Text>
                                                {selectedMembershipType.code === item.code && <CheckCircle size={16} color={item.color} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Payment Amount Input */}
                        <View style={styles.roleSelector}>
                            <Text style={[styles.roleLabel, { color: colors.text }]}>{t('admin.users.paymentAmount')}</Text>
                            <TextInput
                                style={[styles.dropdownBtn, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                placeholder="5000"
                                keyboardType="numeric"
                                value={paymentAmount}
                                onChangeText={setPaymentAmount}
                                placeholderTextColor={colors.icon}
                            />
                        </View>

                        {/* Payment Method Selector */}
                        <View style={styles.roleSelector}>
                            <Text style={[styles.roleLabel, { color: colors.text }]}>{t('admin.users.paymentMethod')}</Text>
                            <TouchableOpacity
                                style={[styles.dropdownBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => { lightImpact(); setShowPaymentMethodDropdown(!showPaymentMethodDropdown); }}
                            >
                                <Text style={[styles.dropdownBtnText, { color: colors.text }]}>{paymentMethod}</Text>
                                {showPaymentMethodDropdown ? <ChevronUp size={20} color={colors.icon} /> : <ChevronDown size={20} color={colors.icon} />}
                            </TouchableOpacity>

                            {showPaymentMethodDropdown && (
                                <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <ScrollView
                                        style={styles.dropdownScroll}
                                        nestedScrollEnabled={true}
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {['Cash', 'Digital'].map((method) => (
                                            <TouchableOpacity
                                                key={method}
                                                style={[styles.dropdownItem, { backgroundColor: colors.card }]}
                                                onPress={() => {
                                                    lightImpact();
                                                    setPaymentMethod(method);
                                                    setShowPaymentMethodDropdown(false);
                                                }}
                                            >
                                                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{method}</Text>
                                                {paymentMethod === method && <CheckCircle size={16} color={colors.primary} />}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Validity Date Display */}
                        <View style={styles.roleSelector}>
                            <Text style={[styles.roleLabel, { color: colors.text }]}>{t('admin.users.validUntil')}</Text>
                            <View style={[styles.dropdownBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Text style={[styles.dropdownBtnText, { color: colors.text }]}>
                                    {validityDate.toDateString()}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.modalActions, { flexDirection: 'column', gap: 12 }]}>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <SecondaryButton
                                    title={t('common.cancel')}
                                    onPress={() => { lightImpact(); setApprovalModalVisible(false); }}
                                    style={{ flex: 1, backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }}
                                    textStyle={{ color: colors.text }}
                                />
                                <PrimaryButton
                                    title={selectedUser?.is_paid_member ? t('common.save') : t('buttons.approve')}
                                    onPress={confirmApproval}
                                    loading={approving}
                                    style={{ flex: 1 }}
                                />
                            </View>

                            {selectedUser?.is_paid_member && (
                                <DangerButton
                                    title={t('buttons.revoke') || 'Revoke'}
                                    onPress={() => {
                                        Alert.alert(
                                            t('buttons.revoke') || 'Revoke',
                                            'Are you sure? This will remove the ID and status.',
                                            [
                                                { text: t('common.cancel'), style: 'cancel' },
                                                {
                                                    text: t('buttons.revoke') || 'Revoke',
                                                    style: 'destructive',
                                                    onPress: async () => {
                                                        try {
                                                            const { error } = await supabase.rpc('revoke_membership', {
                                                                target_user_id: selectedUser.id
                                                            });

                                                            if (error) throw error;

                                                            setApprovalModalVisible(false);
                                                            fetchUsers();
                                                        } catch (error: any) {
                                                            Alert.alert(t('common.error'), error.message || 'Failed to revoke membership');
                                                        }
                                                    }
                                                }
                                            ]
                                        );
                                    }}
                                    style={{ width: '100%' }}
                                />
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Designation Modal */}
            <Modal
                visible={desigModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => { lightImpact(); setDesigModalVisible(false); }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('admin.actions.manageUsers')}</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
                            Set designation for {selectedUser?.full_name}.
                        </Text>

                        <TextInput
                            style={[styles.rankInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="e.g. Senior Manager"
                            value={desigInput}
                            onChangeText={setDesigInput}
                            autoFocus
                            placeholderTextColor={colors.icon}
                        />

                        <View style={styles.modalActions}>
                            <SecondaryButton
                                title={t('common.cancel')}
                                onPress={() => { lightImpact(); setDesigModalVisible(false); }}
                                style={{ flex: 1, backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }}
                                textStyle={{ color: colors.text }}
                            />

                            <PrimaryButton
                                title={t('common.save')}
                                onPress={saveDesignation}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

export default AdminUsersScreen;

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
        backgroundColor: Colors.light.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    backBtn: { padding: 5 },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
        flex: 1,
        marginLeft: 10,
    },
    langToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    langText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    listContent: {

        padding: 20,
    },
    userCard: {
        backgroundColor: Colors.light.card,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: Colors.light.icon,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center', // Align avatar top
        marginBottom: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.light.background,
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: Colors.light.icon,
    },
    userDesignation: {
        fontSize: 12,
        color: Colors.light.icon,
        marginTop: 2,
        fontStyle: 'italic',
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeAdmin: {
        backgroundColor: '#ede9fe', // violet-100
    },
    badgeMember: {
        backgroundColor: Colors.light.background,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    badgeTextAdmin: {
        color: '#7c3aed', // violet-600
    },
    badgeTextMember: {
        color: Colors.light.icon,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8,
        alignItems: 'center',
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.light.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    rankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FCD34D'
    },
    rankText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#B45309'
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.light.card,
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.light.icon,
        textAlign: 'center',
        marginBottom: 20,
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        padding: 4,
    },
    rankInput: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 18,
        textAlign: 'center',
        color: Colors.light.text,
        marginBottom: 24,
        backgroundColor: Colors.light.background,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: Colors.light.background,
    },
    saveBtn: {
        backgroundColor: Colors.light.warning,
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.icon,
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFF',
    },
    roleSelector: {
        width: '100%',
        marginBottom: 24,
    },
    roleLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 10,
    },
    dropdownBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        backgroundColor: Colors.light.background,
    },
    dropdownBtnText: {
        fontSize: 15,
        color: Colors.light.text,
    },
    dropdownList: {
        marginTop: 8,
        backgroundColor: Colors.light.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        overflow: 'hidden',
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: Colors.light.card,
    },
    dropdownItemText: {
        fontSize: 14,
        color: Colors.light.text,
    },
    dropdownDivider: {
        height: 1,
        backgroundColor: Colors.light.border,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.card,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.light.border,
        height: 52,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: Colors.light.text,
        fontSize: 16,
        fontWeight: '500',
    },
    filterSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 12,
    },
    filterBtnContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        overflow: 'hidden',
    },
    filterBtnGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBtn: {
        width: 52,
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.card,
    },

    expandedFilters: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        zIndex: 5000,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.6,
    },
    filterDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        height: 50,
    },
    filterDropdownText: {
        fontSize: 15,
        fontWeight: '600',
    },
    clearFiltersBtn: {
        alignSelf: 'center',
        paddingVertical: 4,
    },
    clearFiltersText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    inlineDropdown: {
        position: 'absolute',
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        zIndex: 6000,
        paddingVertical: 8,
        overflow: 'hidden',
        elevation: 10,
    },
    dropdownModalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    inlineDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    inlineDropdownText: {
        fontSize: 14,
        fontWeight: '500',
    },
    deleteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        marginTop: 12,
        borderTopWidth: 1,
        gap: 8,
        justifyContent: 'center',
    },
    deleteText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
