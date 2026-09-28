import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, TextInput, ActivityIndicator, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { ArrowLeft, Search, Filter, Calendar, CreditCard, AlertTriangle, Edit2, ChevronDown, ChevronUp, CheckCircle, Languages } from 'lucide-react-native';
import { PrimaryButton, SecondaryButton, DangerButton, IconButton } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { DISTRICTS, MEMBERSHIP_TYPES, District } from '../../constants/Districts';
import { useAuth } from '../../ctx/AuthContext';
import { useTheme } from '../../ctx/ThemeContext';
import { useLanguage } from '../../ctx/LanguageContext';
import { generateReceiptPDF } from '../../lib/receiptGenerator';
import { useHaptics } from '../../hooks/useHaptics';

import DateTimePicker from '@react-native-community/datetimepicker';

export default function MembershipManagementScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const { language, setLanguage } = useLanguage();
    const { lightImpact, successFeedback, errorFeedback } = useHaptics();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'lifetime' | 'global' | 'expired'>('all');
    const { user } = useAuth();
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const [currentUserDivision, setCurrentUserDivision] = useState<string | null>(null);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [selectedDistrict, setSelectedDistrict] = useState(DISTRICTS[0]);
    const [selectedMembershipType, setSelectedMembershipType] = useState(MEMBERSHIP_TYPES[0]);
    const [validityDate, setValidityDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('5000');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] = useState(false);

    useEffect(() => {
        checkMyRole();
        fetchMembers();
    }, []);

    const checkMyRole = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('role, division').eq('id', user.id).single();
        setCurrentUserRole(data?.role);
        setCurrentUserDivision(data?.division);
    };

    const fetchMembers = async () => {
        setLoading(true);
        // Fetch users
        let query = supabase
            .from('profiles')
            .select('*')
            .order('membership_expiry', { ascending: true }); // Expiring soonest first

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
            Alert.alert(t('common.error'), 'Failed to fetch membership data');
            console.error(error);
        } else {
            setMembers(data || []);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const getDaysRemaining = (expiryDate: string, memberType: string) => {
        if (memberType === 'lifetime' || memberType === 'Life Membership (LM)') return 9999;
        if (!expiryDate) return -1;
        const now = new Date();
        const expiry = new Date(expiryDate);
        if (expiry.getFullYear() > 3000) return 9999;

        const diffTime = expiry.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const openEditModal = (member: any) => {
        lightImpact();
        setSelectedMember(member);

        // Find existing values
        const existingDistrict = DISTRICTS.find((d: District) => member.division === d.name) || DISTRICTS[0];
        // Match by label or value
        const existingType = MEMBERSHIP_TYPES.find((t: any) => member.membership_type === t.label || member.membership_type === t.value) || MEMBERSHIP_TYPES[0];

        setSelectedDistrict(existingDistrict);
        setSelectedMembershipType(existingType);

        // Set payment amount based on membership type
        if (existingType.value === 'Life') {
            setPaymentAmount('36000');
        } else {
            setPaymentAmount('5000');
        }

        if (member.membership_expiry) {
            setValidityDate(new Date(member.membership_expiry));
        } else {
            setValidityDate(new Date());
        }

        setEditModalVisible(true);
    };

    const confirmUpdate = async () => {
        if (!selectedMember) return;
        setUpdating(true);

        try {
            const { data, error } = await supabase.rpc('approve_membership', {
                target_user_id: selectedMember.id,
                district_code: selectedDistrict.code,
                district_name: selectedDistrict.name,
                membership_type_code: selectedMembershipType.code,
                membership_type_label: selectedMembershipType.value,
                validity_date: validityDate.toISOString(),
                payment_amount: parseFloat(paymentAmount) || 5000,
                payment_method: paymentMethod
            });

            if (error) throw error;

            successFeedback();
            // Show success message first
            Alert.alert(
                t('common.success'),
                `Membership Approved!\nID: ${data.sabca_id}\nTransaction: ${data.transaction_id}\n\nTransaction saved. User can download receipt from history.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setEditModalVisible(false);
                            fetchMembers();
                        }
                    }
                ]
            );

        } catch (error: any) {
            errorFeedback();
            Alert.alert(t('common.error'), error.message);
        } finally {
            setUpdating(false);
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch =
            m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.membership_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.sabca_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        const daysRemaining = getDaysRemaining(m.membership_expiry, m.membership_type);
        const isGlobal = m.membership_type === 'Global' || m.membership_type === 'Global Membership (GM)';
        const isLifetime = daysRemaining > 8000;
        const isExpired = !isLifetime && daysRemaining <= 0;
        const isActive = !isGlobal && !isLifetime && daysRemaining > 0;

        if (filter === 'global') return isGlobal;
        if (filter === 'lifetime') return isLifetime && !isGlobal;
        if (filter === 'expired') return isExpired && !isGlobal;
        if (filter === 'active') return isActive;

        return true;
    });

    const renderMemberItem = ({ item }: { item: any }) => {
        const daysRemaining = getDaysRemaining(item.membership_expiry, item.membership_type);
        const isLifetime = daysRemaining > 8000;
        const isGlobal = item.membership_type === 'Global' || item.membership_type === 'Global Membership (GM)';
        const isExpired = !isLifetime && daysRemaining <= 0;
        const isExpiringSoon = !isLifetime && daysRemaining > 0 && daysRemaining <= 30;

        return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Image source={{ uri: item.avatar_url || 'https://i.pravatar.cc/150?img=12' }} style={[styles.avatar, { backgroundColor: colors.background }]} />
                        <View style={styles.headerInfo}>
                            <Text style={[styles.name, { color: colors.text }]}>{item.full_name}</Text>
                            <Text style={[styles.idText, { color: colors.icon }]}>{item.sabca_id || 'ID Pending'}</Text>
                            {item.membership_id && item.membership_id !== item.sabca_id && (
                                <Text style={[styles.legacyId, { color: colors.icon }]}>Legacy: {item.membership_id}</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        <View style={[
                            styles.compactBadge,
                            isGlobal ? { backgroundColor: '#E0E7FF' } :
                                isLifetime ? { backgroundColor: '#F3E8FF' } :
                                    isExpired ? { backgroundColor: '#FEE2E2' } :
                                        isExpiringSoon ? { backgroundColor: '#FEF3C7' } : { backgroundColor: '#DCFCE7' }
                        ]}>
                            <Text style={[
                                styles.compactBadgeText,
                                isGlobal ? { color: '#4338CA' } :
                                    isLifetime ? { color: '#6D28D9' } :
                                        isExpired ? { color: '#B91C1C' } :
                                            isExpiringSoon ? { color: '#B45309' } : { color: '#166534' }
                            ]}>
                                {isGlobal ? t('admin.membership.global') : isLifetime ? t('admin.membership.lifetime') : isExpired ? t('admin.membership.expired') : isExpiringSoon ? t('common.renewal') : t('admin.membership.active')}
                            </Text>
                        </View>
                        <IconButton
                            icon={<Edit2 size={16} color={colors.primary} />}
                            onPress={() => openEditModal(item)}
                            size={36}
                            backgroundColor={colors.background}
                            style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
                        />
                    </View>
                </View>

                <View style={[styles.detailsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                    <View style={styles.detailItem}>
                        <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
                            <Calendar size={14} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>{t('admin.users.validUntil')}</Text>
                            <Text style={[styles.detailValue, { color: colors.text }, isExpired && { color: colors.error }]}>
                                {isLifetime ? t('admin.membership.lifetime') : item.membership_expiry ? new Date(item.membership_expiry).toLocaleDateString() : 'N/A'}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.detailItem}>
                        <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
                            <CreditCard size={14} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>{t('admin.users.division')}</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                                {item.division ? item.division.split('(')[0].trim() : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* ... header ... */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('admin.membership.title')}</Text>

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

            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Search size={20} color={colors.icon} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={t('admin.membership.searchPlaceholder')}
                    placeholderTextColor={colors.icon}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                >
                    {['all', 'active', 'lifetime', 'global', 'expired'].map((f) => {
                        const isSelected = filter === f;

                        let bgColor = isDark ? '#1E293B' : '#F1F5F9';
                        let textColor = colors.icon;

                        // Only apply colors if selected (ignoring 'all' keeping primary)
                        if (isSelected) {
                            if (f === 'all') {
                                bgColor = colors.primary;
                                textColor = '#FFFFFF';
                            } else if (f === 'active') {
                                bgColor = '#DCFCE7';
                                textColor = '#166534';
                            } else if (f === 'lifetime') {
                                bgColor = '#F3E8FF';
                                textColor = '#6D28D9';
                            } else if (f === 'global') {
                                bgColor = '#E0E7FF';
                                textColor = '#4338CA';
                            } else if (f === 'expired') {
                                bgColor = '#FEE2E2';
                                textColor = '#B91C1C';
                            }
                        }

                        return (
                            <TouchableOpacity
                                key={f}
                                style={[
                                    styles.filterBtn,
                                    {
                                        backgroundColor: bgColor,
                                        borderWidth: 0,
                                        paddingHorizontal: 16
                                    }
                                ]}
                                onPress={() => { lightImpact(); setFilter(f as any); }}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { color: textColor },
                                    isSelected && f === 'all' && styles.filterTextActive
                                ]}>
                                    {t(`admin.membership.${f}`).toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <FlatList
                data={filteredMembers}
                renderItem={renderMemberItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { lightImpact(); setRefreshing(true); fetchMembers(); }} />}
                ListEmptyComponent={
                    !loading ? (
                        <Text style={[styles.emptyText, { color: colors.icon }]}>{t('common.none')}</Text>
                    ) : (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                    )
                }
            />

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => { lightImpact(); setEditModalVisible(false); }}
            >
                <TouchableWithoutFeedback onPress={() => { lightImpact(); setEditModalVisible(false); }}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={(e: any) => e.stopPropagation()}>
                            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                >
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>{t('admin.users.updateMembership')}</Text>
                                    <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
                                        Modify details for {selectedMember?.full_name}
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
                                                    <ScrollView
                                                        style={styles.dropdownScroll}
                                                        nestedScrollEnabled={true}
                                                        showsVerticalScrollIndicator={true}
                                                    >
                                                        {DISTRICTS.map((item: District) => (
                                                            <TouchableOpacity
                                                                key={item.code}
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
                                                    <ScrollView
                                                        style={styles.dropdownScroll}
                                                        nestedScrollEnabled={true}
                                                        showsVerticalScrollIndicator={false}
                                                    >
                                                        {MEMBERSHIP_TYPES.map((item: any) => (
                                                            <TouchableOpacity
                                                                key={item.code}
                                                                style={[styles.dropdownItem, { backgroundColor: colors.card }]}
                                                                onPress={() => {
                                                                    lightImpact();
                                                                    setSelectedMembershipType(item);
                                                                    setShowTypeDropdown(false);

                                                                    // Auto-update payment amount based on type
                                                                    if (item.value === 'Life') {
                                                                        setPaymentAmount('36000');
                                                                    } else {
                                                                        setPaymentAmount('5000');
                                                                    }

                                                                    // Auto-update validity on type change
                                                                    const d = new Date();
                                                                    if (item.value === 'Life') {
                                                                        d.setFullYear(d.getFullYear() + 100);
                                                                    } else {
                                                                        // Annual & Global -> 1 Year
                                                                        d.setFullYear(d.getFullYear() + 1);
                                                                    }
                                                                    setValidityDate(d);
                                                                }}
                                                            >
                                                                <Text style={[styles.dropdownItemText, { color: item.color }]}>{item.label}</Text>
                                                                {selectedMembershipType.code === item.code && <CheckCircle size={16} color={item.color} />}
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Payment Amount Input */}
                                    <View style={styles.roleSelector}>
                                        <Text style={[styles.roleLabel, { color: colors.text }]}>{t('admin.users.paymentAmount')}</Text>
                                        <TextInput
                                            style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                            value={paymentAmount}
                                            onChangeText={setPaymentAmount}
                                            keyboardType="numeric"
                                            placeholder="5000"
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
                                            {showPaymentMethodDropdown ? <ChevronUp size={20} color={colors.text} /> : <ChevronDown size={20} color={colors.text} />}
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
                                        <TouchableOpacity
                                            style={[styles.dropdownBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                                            onPress={() => { lightImpact(); setShowDatePicker(true); }}
                                        >
                                            <Text style={[styles.dropdownBtnText, { color: colors.text }]}>
                                                {validityDate.toLocaleDateString()}
                                            </Text>
                                            <Calendar size={20} color={colors.icon} />
                                        </TouchableOpacity>

                                        {showDatePicker && (
                                            <View style={Platform.OS === 'ios' ? [styles.datePickerContainer, { backgroundColor: colors.background, borderColor: colors.border }] : {}}>
                                                <DateTimePicker
                                                    value={validityDate}
                                                    mode="date"
                                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                    onChange={(event, selectedDate) => {
                                                        const currentDate = selectedDate || validityDate;
                                                        setValidityDate(currentDate);
                                                        if (Platform.OS === 'android') {
                                                            setShowDatePicker(false);
                                                        }
                                                    }}
                                                    textColor={colors.text}
                                                />
                                                {Platform.OS === 'ios' && (
                                                    <TouchableOpacity
                                                        style={[styles.datePickerCloseBtn, { borderTopColor: colors.border }]}
                                                        onPress={() => { lightImpact(); setShowDatePicker(false); }}
                                                    >
                                                        <Text style={[styles.datePickerCloseText, { color: colors.primary }]}>{t('common.ok')}</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.modalActions}>
                                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                            <SecondaryButton
                                                title={t('common.cancel')}
                                                onPress={() => { lightImpact(); setEditModalVisible(false); }}
                                                disabled={updating}
                                                style={{ flex: 1, backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }}
                                                textStyle={{ color: colors.text }}
                                            />

                                            <PrimaryButton
                                                title={t('common.save')}
                                                onPress={confirmUpdate}
                                                loading={updating}
                                                style={{ flex: 1 }}
                                            />
                                        </View>

                                        {selectedMember?.is_paid_member && (
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
                                                                            target_user_id: selectedMember.id
                                                                        });

                                                                        if (error) throw error;

                                                                        setEditModalVisible(false);
                                                                        fetchMembers();
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
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.card,
        margin: 20,
        marginBottom: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        height: 48,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: '100%', fontSize: 15, color: Colors.light.text },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 10,
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    filterBtnActive: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.primary,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    filterTextActive: {
        color: '#FFF',
    },
    listContent: { padding: 20 },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },

    // Card Styles
    card: {
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        flex: 1,
    },
    headerInfo: {
        flex: 1,
    },
    headerActions: {
        alignItems: 'flex-end',
        gap: 8,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
    },
    idText: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    legacyId: {
        fontSize: 11,
        fontStyle: 'italic',
        marginTop: 1,
        opacity: 0.6,
    },
    detailsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    iconWrapper: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    verticalDivider: {
        width: 1,
        height: '100%',
        opacity: 0.3,
    },
    compactBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    compactBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: Colors.light.card,
        borderRadius: 16,
        padding: 24,
        maxHeight: '85%', // Increased slightly
    },
    // ...
    datePickerContainer: {
        backgroundColor: Colors.light.background, // Lighter background
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: Colors.light.border,
        overflow: 'hidden',
    },
    datePickerCloseBtn: {
        backgroundColor: 'transparent',
        padding: 10,
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    datePickerCloseText: {
        color: Colors.light.primary, // Blue text instead of button
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 10,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
        textAlign: 'center',
    },
    roleSelector: {
        marginBottom: 20,
    },
    roleLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    dropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
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
        shadowRadius: 12,
        elevation: 5,
        overflow: 'hidden',
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    dropdownItemText: {
        fontSize: 15,
        color: Colors.light.text,
    },
    dropdownDivider: {
        height: 1,
        backgroundColor: Colors.light.border,
    },
    modalActions: {
        flexDirection: 'column',
        marginTop: 10,
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
        backgroundColor: Colors.light.primary,
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.icon,
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
    rankInput: {
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 20,
    },
    amountInput: {
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.light.text,
    },

});
