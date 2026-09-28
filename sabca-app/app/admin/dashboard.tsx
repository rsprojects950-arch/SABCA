import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Calendar, MessageSquare, ArrowLeft, PlusCircle, CheckCircle, TrendingUp, ShieldAlert, ChevronRight, CreditCard } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../ctx/AuthContext';


import { useTheme } from '../../ctx/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../ctx/LanguageContext';
import { Languages } from 'lucide-react-native';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminDashboard() {
    const router = useRouter();
    const { userRole } = useAuth();
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const { language, setLanguage } = useLanguage();
    const { lightImpact } = useHaptics();

    const [stats, setStats] = useState({
        members: 0,
        events: 0,
        news: 0,
        grievances: 0
    });
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            // Fetch total members
            const { count: membersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            // Fetch active events
            const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });

            // Fetch news count
            const { count: newsCount } = await supabase.from('news').select('*', { count: 'exact', head: true });

            // Fetch open grievances
            const { count: grievancesCount } = await supabase
                .from('grievances')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'Resolved')
                .neq('status', 'Rejected');

            setStats({
                members: membersCount || 0,
                events: eventsCount || 0,
                news: newsCount || 0,
                grievances: grievancesCount || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            Alert.alert('Error', 'Failed to fetch dashboard stats');
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    const onRefresh = () => {
        lightImpact();
        setRefreshing(true);
        fetchStats();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} style={styles.backBtn}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {userRole === 'admin' ? t('admin.console') : t('admin.panel')}
                    </Text>
                </View>

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

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >

                {/* Stats Grid */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('admin.overview')}</Text>
                <View style={styles.statsGrid}>
                    <StatCard icon={Users} label={t('admin.stats.totalMembers')} value={stats.members.toString()} color="#4F46E5" themeColors={colors} isDark={isDark} />
                    <StatCard icon={Calendar} label={t('admin.stats.events')} value={stats.events.toString()} color="#F59E0B" themeColors={colors} isDark={isDark} />
                    <StatCard icon={MessageSquare} label={t('admin.stats.newsItems')} value={stats.news.toString()} color="#10B981" themeColors={colors} isDark={isDark} />
                    <StatCard icon={ShieldAlert} label={t('admin.stats.openGrievances')} value={stats.grievances.toString()} color="#EF4444" themeColors={colors} isDark={isDark} />
                </View>

                {/* Management Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('admin.management')}</Text>

                <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => { lightImpact(); router.push('/admin/create-hub'); }}>
                    <LinearGradient colors={Colors.gradients.training} style={styles.actionIcon}>
                        <PlusCircle size={24} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.actionInfo}>
                        <Text style={[styles.actionTitle, { color: colors.text }]}>{t('admin.actions.createNewContent')}</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.icon }]}>{t('admin.actions.createNewContentDesc')}</Text>
                    </View>
                    <ChevronRight size={20} color={colors.icon} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => { lightImpact(); router.push('/admin/grievances'); }}>
                    <LinearGradient colors={['#FCA5A5', '#EF4444']} style={styles.actionIcon}>
                        <ShieldAlert size={24} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.actionInfo}>
                        <Text style={[styles.actionTitle, { color: colors.text }]}>{t('admin.actions.manageGrievances')}</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.icon }]}>{t('admin.actions.manageGrievancesDesc')}</Text>
                    </View>
                    <ChevronRight size={20} color={colors.icon} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => { lightImpact(); router.push('/admin/users'); }}>
                    <LinearGradient colors={Colors.gradients.primary} style={styles.actionIcon}>
                        <Users size={24} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.actionInfo}>
                        <Text style={[styles.actionTitle, { color: colors.text }]}>{t('admin.actions.manageUsers')}</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.icon }]}>{t('admin.actions.manageUsersDesc')}</Text>
                    </View>
                    <ChevronRight size={20} color={colors.icon} />
                </TouchableOpacity>



                <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => { lightImpact(); router.push('/admin/membership'); }}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.actionIcon}>
                        <CreditCard size={24} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.actionInfo}>
                        <Text style={[styles.actionTitle, { color: colors.text }]}>{t('admin.actions.membershipManagement')}</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.icon }]}>{t('admin.actions.membershipManagementDesc')}</Text>
                    </View>
                    <ChevronRight size={20} color={colors.icon} />
                </TouchableOpacity>





            </ScrollView>
        </SafeAreaView>
    );
}

const StatCard = ({ icon: Icon, label, value, color, themeColors, isDark }: any) => (
    <View style={[styles.statCard, { backgroundColor: themeColors.card, shadowColor: themeColors.shadow }]}>
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
            <Icon size={20} color={color} />
        </View>
        <Text style={[styles.statValue, { color: themeColors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: themeColors.icon }]}>{label}</Text>
    </View>
);

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
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
        backgroundColor: Colors.light.card,
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
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
        fontWeight: '600',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 16,
        marginTop: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        width: '48%',
        backgroundColor: Colors.light.card,
        borderRadius: 16,
        padding: 16,
        shadowColor: Colors.light.icon,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: Colors.light.icon,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.card,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: Colors.light.icon,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionInfo: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 14,
        color: Colors.light.icon,
    },
});
