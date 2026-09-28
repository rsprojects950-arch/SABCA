import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Scale, FileText, Phone, MessageSquare, ChevronRight } from 'lucide-react-native';

export default function LegalServicesScreen() {
    const router = useRouter();

    const OPTIONS = [
        {
            title: 'File a Contractor Grievance',
            desc: 'Formal dispute resolution with main contractors.',
            icon: Scale,
            route: '/services/grievances/create',
            color: '#EF4444'
        },
        {
            title: 'Legal Consultation',
            desc: 'Book a session with our panel of experts.',
            icon: Phone,
            route: '', // Placeholder
            color: '#3B82F6'
        },
        {
            title: 'Document Review',
            desc: 'Get your contracts and tenders reviewed.',
            icon: FileText,
            route: '', // Placeholder
            color: '#10B981'
        }
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Legal Support</Text>
                <Text style={styles.headerSubtitle}>Expert legal assistance for your construction business.</Text>
            </View>

            <View style={styles.list}>
                {OPTIONS.map((opt, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.card}
                        onPress={() => opt.route ? router.push(opt.route as any) : null}
                    >
                        <View style={[styles.iconBox, { backgroundColor: `${opt.color}15` }]}>
                            <opt.icon size={24} color={opt.color} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{opt.title}</Text>
                            <Text style={styles.cardDesc}>{opt.desc}</Text>
                        </View>
                        <ChevronRight size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>SABCA Legal Cell</Text>
                <Text style={styles.infoText}>
                    Our legal cell operates Mon-Fri, 10 AM to 5 PM. For urgent matters, please contact the helpline directly.
                </Text>
                <View style={styles.contactRow}>
                    <MessageSquare size={16} color={Colors.light.primary} />
                    <Text style={styles.contactText}>helpline@sabca.in</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { padding: 20 },
    header: { marginBottom: 24, paddingVertical: 10 },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#1E293B' },
    headerSubtitle: { fontSize: 16, color: '#64748B', marginTop: 8 },
    list: { gap: 16, marginBottom: 30 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    cardDesc: { fontSize: 13, color: '#64748B', marginTop: 2 },
    infoBox: {
        backgroundColor: '#EFF6FF',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E40AF', marginBottom: 8 },
    infoText: { fontSize: 14, color: '#334155', lineHeight: 22, marginBottom: 12 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    contactText: { fontSize: 14, color: Colors.light.primary, fontWeight: '600' },
});
