import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { X, Calendar, Newspaper, Users, ChevronRight, ShieldAlert, Languages, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../ctx/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../ctx/LanguageContext';

export default function CreateHubScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const { language, setLanguage } = useLanguage();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('hub.title')}</Text>

                <TouchableOpacity
                    style={[styles.langToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => setLanguage(language === 'en' ? 'te' : 'en')}
                >
                    <Text style={[styles.langText, { color: colors.text }]}>
                        {language === 'en' ? 'తెలుగు' : 'EN'}
                    </Text>
                    <Languages size={18} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.subtitle, { color: colors.icon }]}>{t('hub.subtitle')}</Text>

                <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => router.push('/admin/create-event')}>
                    <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.iconBox}>
                        <Calendar size={32} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.cardInfo}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('hub.event')}</Text>
                        <Text style={[styles.cardDesc, { color: colors.icon }]}>{t('hub.eventDesc')}</Text>
                    </View>
                    <ChevronRight size={24} color={colors.icon} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => router.push('/admin/create-news')}>
                    <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.iconBox}>
                        <Newspaper size={32} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.cardInfo}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('hub.news')}</Text>
                        <Text style={[styles.cardDesc, { color: colors.icon }]}>{t('hub.newsDesc')}</Text>
                    </View>
                    <ChevronRight size={24} color={colors.icon} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => router.push('/admin/manage-directory')}>
                    <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.iconBox}>
                        <Users size={32} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.cardInfo}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Manage Directory</Text>
                        <Text style={[styles.cardDesc, { color: colors.icon }]}>Add or edit state and division contacts</Text>
                    </View>
                    <ChevronRight size={24} color={colors.icon} />
                </TouchableOpacity>


                <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => router.push('/admin/create-go')}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.iconBox}>
                        <ShieldAlert size={32} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.cardInfo}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('hub.go')}</Text>
                        <Text style={[styles.cardDesc, { color: colors.icon }]}>{t('hub.goDesc')}</Text>
                    </View>
                    <ChevronRight size={24} color={colors.icon} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => router.push('/admin/manage-polls')}>
                    <LinearGradient colors={['#EC4899', '#BE185D']} style={styles.iconBox}>
                        <CheckCircle size={32} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.cardInfo}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Community Poll</Text>
                        <Text style={[styles.cardDesc, { color: colors.icon }]}>Create interactive voting polls</Text>
                    </View>
                    <ChevronRight size={24} color={colors.icon} />
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    closeBtn: {
        padding: 5,
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
    content: {
        padding: 24,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 24,
        textAlign: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
});
