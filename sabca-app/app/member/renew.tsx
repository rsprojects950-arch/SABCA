import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Info, MessageCircle, Phone } from 'lucide-react-native';
import { useTheme } from '../../ctx/ThemeContext';

export default function MembershipRenewalScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const handleContact = () => {
        // You can add logic here to open WhatsApp or Dial key
        // For now, let's just open a generic contact or do nothing
        // Linking.openURL('https://wa.me/919876543210'); 
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={[styles.backText, { color: colors.primary }]}>Close</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Membership Renewal</Text>
                <View style={{ width: 50 }} />
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(229, 57, 53, 0.1)' : '#EFF6FF' }]}>
                        <Info size={48} color={colors.primary} />
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>Action Required</Text>

                    <Text style={[styles.description, { color: colors.icon }]}>
                        To renew your membership or obtain your SABCA ID, please contact your District Coordinator.
                    </Text>

                    <Text style={[styles.description, { color: colors.icon }]}>
                        They will assist you with the renewal process and provide you with the necessary details.
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backText: { fontSize: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scroll: { flexGrow: 1, padding: 20, justifyContent: 'center' },
    card: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 30,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 12,
    },
    infoBox: {
        marginTop: 16,
        backgroundColor: '#F1F5F9',
        padding: 16,
        borderRadius: 12,
        width: '100%',
    },
    infoText: {
        fontSize: 14,
        color: '#475569',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    btnPrimary: {
        backgroundColor: Colors.light.primary, // Keep brand color for buttons usually
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        width: '100%',
    },
    btnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
