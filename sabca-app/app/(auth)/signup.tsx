import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Lock, Mail, User, Eye, EyeOff, Check, Phone } from 'lucide-react-native';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const router = useRouter();

    async function signUpWithEmail() {
        if (!email || !password || !fullName || !confirmPassword || !phone) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (phone.length !== 10) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return;
        }

        if (!agreeTerms) {
            Alert.alert('Error', 'You must agree to the Terms and Conditions to register.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);

        // 1. Sign up the user (create auth user)
        const { data: { session, user }, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: '+91' + phone,
                }
            }
        });

        if (error) {
            Alert.alert('Signup Failed', error.message);
            setLoading(false);
            return;
        }

        if (user && !session) {
            Alert.alert('Check your email', 'Please check your email for the confirmation link!');
            setLoading(false);
            return;
        }

        if (session) {
            // Optional: You could fetch the profile here to confirm creation, 
            // but usually we just redirect.
            // Router redirect happens in _layout.tsx based on session state.
        }

        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: true, title: '', headerTransparent: true, headerTintColor: '#FFF' }} />
            <LinearGradient
                colors={Colors.gradients.primary}
                style={styles.background}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Join SABCA</Text>
                    <Text style={styles.subtitle}>Create Your Membership Account</Text>
                </View>

                <BlurView intensity={20} tint="light" style={styles.formContainer}>

                    <View style={styles.inputContainer}>
                        <User size={20} color="#E2E8F0" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            placeholderTextColor="#AAC"
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    {/* Phone Number Input */}
                    <View style={styles.inputContainer}>
                        <Phone size={20} color="#E2E8F0" style={styles.icon} />
                        <Text style={styles.prefixText}>+91</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Mobile Number"
                            placeholderTextColor="#AAC"
                            value={phone}
                            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                            keyboardType="number-pad"
                            maxLength={10}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Mail size={20} color="#E2E8F0" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            placeholderTextColor="#AAC"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock size={20} color="#E2E8F0" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#AAC"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            {showPassword ? (
                                <EyeOff size={20} color="#E2E8F0" />
                            ) : (
                                <Eye size={20} color="#E2E8F0" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password Field */}
                    <View style={styles.inputContainer}>
                        <Lock size={20} color="#E2E8F0" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#AAC"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                            {showConfirmPassword ? (
                                <EyeOff size={20} color="#E2E8F0" />
                            ) : (
                                <Eye size={20} color="#E2E8F0" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Terms & Conditions Checkbox */}
                    <View style={styles.checkboxContainer}>
                        <TouchableOpacity
                            style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}
                            onPress={() => setAgreeTerms(!agreeTerms)}
                        >
                            {agreeTerms && <Check size={14} color="#FFF" strokeWidth={3} />}
                        </TouchableOpacity>
                        <View style={styles.termsTextContainer}>
                            <Text style={styles.termsText}>I agree to the </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/terms')}>
                                <Text style={styles.linkText}>Terms & Conditions</Text>
                            </TouchableOpacity>
                            <Text style={styles.termsText}> and </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/privacy')}>
                                <Text style={styles.linkText}>Privacy Policy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, !agreeTerms && styles.buttonDisabled]}
                        onPress={signUpWithEmail}
                        disabled={loading || !agreeTerms}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <LinearGradient
                                colors={agreeTerms ? Colors.gradients.button : ['#94A3B8', '#64748B']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.buttonText}>Register</Text>
                            </LinearGradient>
                        )}
                    </TouchableOpacity>
                </BlurView>

                <View style={styles.kodeSparkFooter}>
                    <Text style={styles.poweredByText}>Powered By InfraXpert</Text>
                    <Text style={styles.kodeSparkText}>Designed and Developed by KodeSpark</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        color: '#E2E8F0',
        marginTop: 8,
        letterSpacing: 1.2,
        fontWeight: '500',
    },
    formContainer: {
        marginHorizontal: 30,
        borderRadius: 20,
        padding: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
    },
    eyeIcon: {
        padding: 5,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 5,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    checkboxChecked: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.primary,
    },

    termsTextContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    termsText: {
        color: '#E2E8F0',
        fontSize: 13,
    },
    linkText: {
        color: '#FDBA74', // Orange tint to stand out
        fontWeight: 'bold',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
    button: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: Colors.light.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.7,
        shadowOpacity: 0,
        elevation: 0,
    },
    gradientButton: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    kodeSparkFooter: {
        marginTop: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    kodeSparkText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    poweredByText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
        textAlign: 'center',
    },
    prefixText: {
        color: '#FFF',
        fontSize: 16,
        marginRight: 8,
        fontWeight: '600',
    },
});
