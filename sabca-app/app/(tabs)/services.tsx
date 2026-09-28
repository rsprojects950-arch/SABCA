import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, BookOpen, Scale, Banknote, HardHat, Building2, ArrowUpRight, Phone, MessageSquare, AlertCircle, Clock, Plus } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../ctx/AuthContext';
import { useTheme } from '../../ctx/ThemeContext';
import { PrimaryButton, SecondaryButton } from '../../components/ui';
import { useHaptics } from '../../hooks/useHaptics';

// Map icon strings to components
const iconMap: any = {
    UserPlus: UserPlus,
    BookOpen: BookOpen,
    Scale: Scale,
    Banknote: Banknote,
    HardHat: HardHat,
    Building2: Building2,
};

export default function ServicesScreen() {
    const router = useRouter();
    const { isMembershipActive } = useAuth();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { lightImpact } = useHaptics();

    const handleRestrictedAction = (action: () => void) => {
        if (isMembershipActive) {
            action();
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
    };

    const staticServices = useMemo(() => [
        {
            title: t('services.membership.title'),
            icon: 'UserPlus',
            items: [
                t('services.membership.newReg'),
                t('services.membership.renewal'),
                t('services.membership.idCard'),
                t('services.membership.verify')
            ]
        },
        {
            title: t('services.training.title'),
            icon: 'BookOpen',
            items: [
                t('services.training.safety'),
                t('services.training.tech'),
                t('services.training.skill'),
                t('services.training.cert')
            ]
        },
        {
            title: t('services.legal.title'),
            icon: 'Scale',
            items: [
                t('services.legal.info'),
                t('services.legal.correspondence'),
                t('services.legal.technical'),
                t('services.legal.esi'),
                t('services.legal.gst'),
                t('services.legal.materials'),
                t('services.legal.machinery')
            ]
        }
    ], [t]);


    const handleServicePress = (item: string) => {
        if (item.includes('Raise a Ticket') || item.includes('Complaint')) {
            handleRestrictedAction(() => router.push('/services/grievances/create'));
        } else if (item.includes('Track Grievance')) {
            handleRestrictedAction(() => router.push('/services/grievances'));
        } else {

        }
    };

    const renderServiceSection = (section: any, index: number) => {
        const IconComponent = iconMap[section.icon] || Building2;
        // Fallback for MessageSquare if not mapped
        const SectionIcon = section.icon === 'MessageSquare' ? MessageSquare : IconComponent;

        return (
            <LinearGradient
                key={index}
                colors={['#E5393580', '#8E44AD80', '#3B82F680']} // Darker gradient border (50% opacity)
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradientBorder}
            >
                <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <LinearGradient
                            colors={Colors.gradients.button}
                            style={styles.iconContainer}
                        >
                            <SectionIcon size={24} color="#FFF" />
                        </LinearGradient>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                    </View>

                    <View style={styles.sectionContent}>
                        {section.items.map((item: string, idx: number) => (
                            <View
                                key={idx}
                                style={styles.serviceItem}
                            >
                                <View style={[styles.bulletPoint, { backgroundColor: colors.primary }]} />
                                <Text style={[styles.serviceItemText, { color: colors.text }]}>{item}</Text>
                                <View style={{ flex: 1 }} />

                            </View>
                        ))}
                    </View>
                </View>
            </LinearGradient>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('services.title')}</Text>
                <Text style={[styles.headerSubtitle, { color: colors.icon }]}>{t('services.subtitle')}</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {staticServices.map((section, index) => renderServiceSection(section, index))}

                <LinearGradient
                    colors={Colors.gradients.primary} // Brand Gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.helpSection}
                >
                    {/* Decorative Background Circles */}
                    <View style={styles.decorativeCircle1} />
                    <View style={styles.decorativeCircle2} />

                    <View style={styles.helpHeader}>
                        <View style={styles.helpIconCircle}>
                            <AlertCircle size={28} color="#FFF" />
                        </View>
                        <View style={{ flex: 1, zIndex: 1 }}>
                            <Text style={styles.helpTitle}>{t('services.help.title')}</Text>
                            <Text style={styles.helpSubtitle}>{t('services.help.subtitle')}</Text>
                        </View>
                    </View>

                    <View style={styles.helpButtons}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#FFF' }]}
                            onPress={() => { lightImpact(); handleRestrictedAction(() => router.push('/services/grievances/create')); }}
                        >
                            <Text style={[styles.actionBtnText, { color: colors.primary }]}>{t('services.help.raise')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}
                            onPress={() => { lightImpact(); handleRestrictedAction(() => router.push('/services/grievances')); }}
                        >
                            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{t('services.help.track')}</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>


            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor handled dynamically
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        // color handled dynamically
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
        // color handled dynamically
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, // Increased to avoid tab bar overlap
    },
    cardGradientBorder: {
        borderRadius: 22, // Slightly larger than inner card
        padding: 1.5, // Thickness of the border
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionCard: {
        borderRadius: 20,
        padding: 20,
        // backgroundColor handled dynamically
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        // color handled dynamically
    },
    sectionContent: {
        paddingLeft: 4,
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        opacity: 0.8,
        // backgroundColor handled dynamically
    },
    serviceItemText: {
        fontSize: 15,
        fontWeight: '500',
        // color handled dynamically
    },
    // Help Section Styles
    helpSection: {
        borderRadius: 24,
        padding: 24,
        marginTop: 10,
        marginBottom: 20,
        shadowColor: '#E53935', // Keep this or adapt if needed
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    helpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    helpIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    helpTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    helpSubtitle: {
        fontSize: 14,
        color: '#E0E7FF',
        opacity: 0.9,
    },
    helpButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        zIndex: 1,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: {
        fontWeight: '600',
        fontSize: 15,
    },
});
