import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Upload, CheckCircle, User, Briefcase, MapPin } from 'lucide-react-native';
import { PrimaryButton } from '../../../components/ui';

export default function MemberRegistrationScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [address, setAddress] = useState('');
    const [memberType, setMemberType] = useState('Individual');

    const handleSubmit = () => {
        if (!fullName || !email || !phone) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        if (phone.length < 10) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Application Submitted', 'Your membership application is under review.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }, 1500);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>New Member Registration</Text>
                <Text style={styles.subtitle}>Join SABCA to access exclusive benefits.</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Details</Text>
                <View style={styles.inputGroup}>
                    <User size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Briefcase size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <MapPin size={20} color="#94A3B8" style={styles.inputIcon} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: 15, color: '#1E293B', fontWeight: '600', marginRight: 8 }}>+91</Text>
                        <View style={{ width: 1, height: 20, backgroundColor: '#E2E8F0', marginRight: 8 }} />
                        <TextInput
                            style={[styles.input, { paddingVertical: 14 }]}
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                            maxLength={10}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Membership Type</Text>
                <View style={styles.typeRow}>
                    {['Individual', 'Corporate', 'Associate'].map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.typeBtn, memberType === type && styles.activeTypeBtn]}
                            onPress={() => setMemberType(type)}
                        >
                            <Text style={[styles.typeText, memberType === type && styles.activeTypeText]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Documents</Text>
                <TouchableOpacity style={styles.uploadBtn}>
                    <Upload size={24} color={Colors.light.primary} />
                    <Text style={styles.uploadText}>Upload Govt ID / Trade License</Text>
                </TouchableOpacity>
            </View>

            <PrimaryButton
                title="Submit Application"
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: 10, marginBottom: 40 }}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    content: { padding: 20 },
    header: { marginBottom: 24 },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.light.text },
    subtitle: { fontSize: 14, color: Colors.light.icon, marginTop: 4 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 12 },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.card,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        marginBottom: 12,
        paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.light.text },
    typeRow: { flexDirection: 'row', gap: 10 },
    typeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.card,
    },
    activeTypeBtn: {
        backgroundColor: Colors.light.background,
        borderColor: Colors.light.primary,
    },
    typeText: { fontSize: 13, color: Colors.light.icon },
    activeTypeText: { color: Colors.light.primary, fontWeight: '600' },
    uploadBtn: {
        borderWidth: 2,
        borderColor: Colors.light.border,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        backgroundColor: Colors.light.background,
        gap: 12,
    },
    uploadText: { color: Colors.light.icon, fontSize: 14 },
});
