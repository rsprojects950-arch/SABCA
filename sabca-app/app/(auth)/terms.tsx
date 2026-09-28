import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../ctx/ThemeContext';

export default function TermsAndConditions() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Terms and Conditions</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>Terms and Conditions for SABCA</Text>
                <Text style={[styles.lastUpdated, { color: colors.icon }]}>Last Updated: February 10, 2026</Text>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Agreement to Terms</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        By creating an account or using the SABCA mobile application (“App”), you agree to be bound by these Terms and Conditions. If you do not agree, do not create an account or use the App.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Eligibility and Registration</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        You must be at least 13 years of age (or the legal age in your jurisdiction) to use this App.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        You agree to provide accurate, current, and complete information during the registration process.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        You are responsible for safeguarding your password and for all activities that occur under your account.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Acceptable Use & Prohibited Conduct</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>You agree NOT to:</Text>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>Use the App for any illegal or unauthorized purpose.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>Post or transmit any content that is defamatory, obscene, or promotes violence/discrimination.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>Attempt to decompile, reverse engineer, or hack the App.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>Use automated systems (bots/scrapers) to access the App without permission.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Intellectual Property</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        All content, features, and functionality (including but not limited to text, graphics, logos, and code) are the exclusive property of SABCA and are protected by international copyright and trademark laws.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>5. AI-Generated Content (2026 Clause)</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>If the App utilizes Artificial Intelligence (AI) features:</Text>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>You acknowledge that AI-generated responses may occasionally be inaccurate or biased.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>You are solely responsible for how you rely on or use any output generated by the App’s AI features.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Limitation of Liability</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        The App is provided on an "AS IS" and "AS AVAILABLE" basis. To the maximum extent permitted by law, SABCA shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the App.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Termination</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We reserve the right to suspend or terminate your account and access to the App at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Changes to Terms</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We may update these terms from time to time. Continued use of the App after changes are posted constitutes your acceptance of the new Terms.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Contact Us</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        For any questions regarding these Terms, please contact: support@infraxpert.in
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    lastUpdated: {
        fontSize: 14,
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    text: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 8,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 8,
    },
    bullet: {
        fontSize: 15,
        marginRight: 8,
        lineHeight: 24,
    },
});
