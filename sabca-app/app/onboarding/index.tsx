import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../ctx/AuthContext';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { User, MapPin, Building, Briefcase, Phone, ArrowRight, ChevronDown, Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import { DISTRICTS, District } from '../../constants/Districts';

import { useTheme } from '../../ctx/ThemeContext';

export default function OnboardingScreen() {
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [fullName, setFullName] = useState('');
    const [division, setDivision] = useState('');
    const [phone, setPhone] = useState('');
    const [membershipId, setMembershipId] = useState('');
    const [location, setLocation] = useState('');

    // Dropdown State
    const [showDivisionPicker, setShowDivisionPicker] = useState(false);

    useEffect(() => {
        if (user) {
            fetchExistingDetails();
        }
    }, [user]);

    const fetchExistingDetails = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, division, phone, sabca_id, membership_id, location, company_name, blood_group')
            .eq('id', user!.id)
            .single();

        if (data) {
            if (data.full_name) setFullName(data.full_name);
            if (data.division) setDivision(data.division);
            // existing phone might not have +91 prefix stored cleanly, or might. 
            // For now, we assume user enters 10 digits.
            if (data.phone) setPhone(data.phone.replace('+91', '').trim());
            if (data.sabca_id) setMembershipId(data.sabca_id);
            else if (data.membership_id) setMembershipId(data.membership_id);
            if (data.location) setLocation(data.location);
        }
    };

    const handleCompleteProfile = async () => {
        if (!fullName || !division || !phone) {
            Alert.alert('Missing Details', 'Please fill in Name, Division, and Phone Number to continue.');
            return;
        }

        if (phone.length < 10) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
            return;
        }

        setLoading(true);

        try {
            const updates = {
                id: user!.id,
                full_name: fullName,
                division: division,
                phone: `+91${phone}`, // Store with code
                location: location,
                sabca_id: null, // Allow trigger to generate ID
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            await supabase.auth.refreshSession();
            router.replace('/(tabs)');

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderDivisionItem = ({ item }: { item: District }) => (
        <TouchableOpacity
            style={[styles.pickerItem, { borderBottomColor: colors.border }]}
            onPress={() => {
                setDivision(item.name);
                setShowDivisionPicker(false);
            }}
        >
            <Text style={[styles.pickerItemText, { color: colors.text }, division === item.name && { color: colors.primary, fontWeight: 'bold' }]}>
                {item.name.replace(/\s*\(.*\)/, '')}
            </Text>
            {division === item.name && <Check size={20} color={colors.primary} />}
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B'] : ['#4facfe', '#00f2fe']}
                style={styles.background}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                    <View>
                        <Text style={styles.title}>Welcome!</Text>
                        <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : 'rgba(255,255,255,0.9)' }]}>Let's get to know you better.</Text>
                    </View>
                    <TouchableOpacity
                        onPress={async () => {
                            await supabase.auth.signOut();
                            router.replace('/(auth)/login');
                        }}
                        style={{ padding: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)', borderRadius: 12 }}
                    >
                        <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 13 }}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.formCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <User size={20} color={colors.icon} style={styles.icon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your full name"
                                value={fullName}
                                onChangeText={setFullName}
                                placeholderTextColor={colors.icon}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Division <Text style={styles.required}>*</Text></Text>
                        <TouchableOpacity
                            style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={() => setShowDivisionPicker(true)}
                        >
                            <Building size={20} color={colors.icon} style={styles.icon} />
                            <Text style={[styles.input, { color: division ? colors.text : colors.icon }]}>
                                {division ? division.replace(/\s*\(.*\)/, '') : "Select your Division"}
                            </Text>
                            <ChevronDown size={20} color={colors.icon} />
                        </TouchableOpacity>
                        <Text style={[styles.hint, { color: colors.icon }]}>This will help connect you with your local members.</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Phone Number <Text style={styles.required}>*</Text></Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Phone size={20} color={colors.icon} style={styles.icon} />
                            <View style={styles.countryCode}>
                                <Text style={[styles.countryCodeText, { color: colors.text }]}>+91</Text>
                            </View>
                            <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Mobile Number"
                                value={phone}
                                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                                keyboardType="phone-pad"
                                maxLength={10}
                                placeholderTextColor={colors.icon}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Location</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <MapPin size={20} color={colors.icon} style={styles.icon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="City or Region"
                                value={location}
                                onChangeText={setLocation}
                                placeholderTextColor={colors.icon}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                        onPress={handleCompleteProfile}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Text style={styles.submitBtnText}>Get Started</Text>
                                <ArrowRight size={20} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Division Selection Modal */}
            <Modal
                transparent={true}
                visible={showDivisionPicker}
                animationType="fade"
                onRequestClose={() => setShowDivisionPicker(false)}
            >
                <BlurView intensity={isDark ? 40 : 20} tint={isDark ? "dark" : "light"} style={styles.modalOverlay}>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
                        <View style={[styles.pickerHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Division</Text>
                            <TouchableOpacity onPress={() => setShowDivisionPicker(false)}>
                                <Text style={[styles.closeText, { color: colors.primary }]}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={DISTRICTS}
                            renderItem={({ item }: { item: District }) => (
                                <TouchableOpacity
                                    style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setDivision(item.name);
                                        setShowDivisionPicker(false);
                                    }}
                                >
                                    <Text style={[styles.pickerItemText, { color: colors.text }, division === item.name && { color: colors.primary, fontWeight: 'bold' }]}>
                                        {item.name.replace(/\s*\(.*\)/, '')}
                                    </Text>
                                    {division === item.name && <Check size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.code}
                            contentContainerStyle={styles.pickerContent}
                        />
                    </View>
                </BlurView>
            </Modal>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 300,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
    },
    formCard: {
        borderRadius: 24,
        padding: 24,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    required: {
        color: '#EF4444',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    countryCode: {
        marginRight: 8,
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    verticalDivider: {
        width: 1,
        height: 20,
        marginRight: 10,
    },
    hint: {
        fontSize: 12,
        marginTop: 6,
    },
    submitBtn: {
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    pickerContainer: {
        borderRadius: 20,
        maxHeight: '70%',
        overflow: 'hidden',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeText: {
        fontWeight: '600',
    },
    pickerContent: {
        padding: 10,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    pickerItemText: {
        fontSize: 16,
    },
    pickerItemTextSelected: {
        fontWeight: 'bold',
    },
});
