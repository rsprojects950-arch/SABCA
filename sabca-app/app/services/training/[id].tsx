import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Calendar, MapPin, Clock, CheckCircle, User, Award } from 'lucide-react-native';

export default function TrainingDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const COURSES: Record<string, { title: string; description: string; instructor: string; syllabus: string[]; access: string; image: string }> = {
        '1': {
            title: 'Advanced Construction Safety',
            description: 'Comprehensive training on safety protocols for high-rise buildings, covering hazard identification, risk assessment, and emergency response.',
            instructor: 'Dr. A. Sharma, Safety Expert',
            syllabus: [
                'Introduction to Safety Standards (NBC 2016)',
                'Hazard Identification & Risk Assessment',
                'Personal Protective Equipment (PPE)',
                'Fire Safety & Emergency Evacuation',
                'SABCA Scaffolding Guidelines'
            ],
            access: 'Member Benefit',
            image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000'
        },
        '2': {
            title: 'Project Management Professional',
            description: 'Practical seminar for civil contractors on project scheduling, resource allocation, tender compliance, and milestone execution.',
            instructor: 'Er. K.V. Rao, Senior Project Director',
            syllabus: [
                'Project Planning & Critical Path Method',
                'Contract Administration & Tender Norms',
                'Cost Control & Billing Milestones',
                'Quality Assurance & Site Audits'
            ],
            access: 'Member Benefit',
            image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000'
        },
        '3': {
            title: 'Sustainable Building Materials',
            description: 'Technical workshop exploring eco-friendly construction materials, fly-ash utilization, green concrete, and energy-efficient design.',
            instructor: 'Prof. M. Reddy, Structural Engineering',
            syllabus: [
                'Green Building Standards & Certifications',
                'Supplementary Cementitious Materials',
                'Recycled Aggregates in Civil Works',
                'Thermal Insulation & Lifecycle Costing'
            ],
            access: 'Member Benefit',
            image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000'
        }
    };

    const course = COURSES[String(id)] || COURSES['1'];

    const handleRegister = () => {
        Alert.alert(
            'Registration Confirmed',
            'Your registration for this seminar has been recorded. Session details will be sent to your registered email.',
            [{ text: 'OK', onPress: () => router.back() }]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Image source={{ uri: course.image }} style={styles.image} resizeMode="cover" />

                <View style={styles.content}>
                    <Text style={styles.title}>{course.title}</Text>

                    <View style={styles.instructorBox}>
                        <User size={16} color="#64748B" />
                        <Text style={styles.instructorText}>{course.instructor}</Text>
                    </View>

                    <Text style={styles.sectionHeader}>About this Course</Text>
                    <Text style={styles.description}>{course.description}</Text>

                    <Text style={styles.sectionHeader}>What You'll Learn</Text>
                    <View style={styles.syllabus}>
                        {course.syllabus.map((item, index) => (
                            <View key={index} style={styles.syllabusItem}>
                                <CheckCircle size={16} color={Colors.light.primary} />
                                <Text style={styles.syllabusText}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.certBox}>
                        <Award size={24} color="#F59E0B" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.certTitle}>Certificate Included</Text>
                            <Text style={styles.certDesc}>Get a verified certificate upon completion.</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View>
                    <Text style={styles.priceLabel}>Access</Text>
                    <Text style={[styles.price, { fontSize: 16, color: Colors.light.primary }]}>{course.access}</Text>
                </View>
                <TouchableOpacity style={styles.enrollBtn} onPress={handleRegister}>
                    <Text style={styles.enrollText}>Register Attendance</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    scroll: { paddingBottom: 100 },
    image: { width: '100%', height: 250 },
    content: { padding: 20, marginTop: -20, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
    instructorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    instructorText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 10, marginTop: 10 },
    description: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 20 },
    syllabus: { gap: 12, marginBottom: 20 },
    syllabusItem: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    syllabusText: { fontSize: 14, color: '#334155', flex: 1 },
    certBox: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEF3C7',
        marginTop: 10
    },
    certTitle: { fontSize: 14, fontWeight: 'bold', color: '#92400E' },
    certDesc: { fontSize: 12, color: '#B45309' },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: { fontSize: 12, color: '#64748B' },
    price: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
    enrollBtn: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12
    },
    enrollText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
