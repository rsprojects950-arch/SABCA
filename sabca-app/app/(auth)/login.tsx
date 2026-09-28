import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { Stack, useRouter, Link } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Lock, Mail, Eye, EyeOff, Check, X, Phone, Fingerprint } from 'lucide-react-native';
import { useAuth } from '../../ctx/AuthContext';
import { useBiometrics } from '../../hooks/useBiometrics';

export default function Login() {
    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    // Forgot Password State
    const [forgotPwdVisible, setForgotPwdVisible] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    const router = useRouter();
    const { isBiometricEnabled, signInWithBiometrics } = useAuth();
    const { authenticate } = useBiometrics();

    React.useEffect(() => {
        if (isBiometricEnabled) {
            handleBiometricLogin();
        }
    }, [isBiometricEnabled]);

    async function handleSignIn() {
        setLoading(true);
        let error;

        if (loginMethod === 'email') {
            const { error: emailError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            error = emailError;
        } else {
            // Validate phone number
            if (phone.length !== 10) {
                Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
                setLoading(false);
                return;
            }

            // Secure Verification Strategy
            try {
                // 1. Verify Phone + Password Together (Safe)
                // This RPC only returns the email IF the password matches.
                // It prevents outsiders from guessing emails by phone numbers.
                const { data: emailData, error: rpcError } = await supabase
                    .rpc('verify_login_by_phone', { 
                        p_phone: '+91' + phone, 
                        p_password: password 
                    });

                if (rpcError) throw rpcError;

                if (!emailData) {
                    throw new Error('Invalid phone number or password.');
                }

                // 2. Sign In with standard Supabase Auth
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: emailData,
                    password,
                });

                if (signInError) throw signInError;

            } catch (err: any) {
                error = err;
            }
        }

        if (error) {
            if (error.message.includes('Email not confirmed')) {
                Alert.alert('Email Verification Required', 'Please check your inbox and verify your email address to log in.');
            } else {
                Alert.alert('Login Failed', error.message || 'Invalid credentials');
            }
        }
        setLoading(false);
    }

    const handleBiometricLogin = async () => {
        const success = await authenticate();
        if (success) {
            setLoading(true);
            const { error } = await signInWithBiometrics();
            if (error) {
                Alert.alert('Login Failed', error.message || 'Stored credentials might be invalid.');
            }
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetEmail) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }

        setResetLoading(true);
        // Generate deep link for the reset password screen
        // Scheme defined in app.json is 'sabcaapp'
        // This handles both dev (exp://) and prod (sabcaapp://)
        // Note: You must add this URL to Supabase Console > Authentication > URL Configuration > Redirect URLs
        const redirectUrl = Linking.createURL('/(auth)/reset-password');


        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: redirectUrl,
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Password reset instructions have been sent to your email.');
            setForgotPwdVisible(false);
            setResetEmail('');
        }
        setResetLoading(false);
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={Colors.gradients.primary}
                style={styles.background}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/images/sabca_new_logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>SABCA</Text>
                <Text style={styles.subtitle}>For All-Works for All-Voice for All Contractors</Text>
            </View>

            <BlurView intensity={20} tint="light" style={styles.formContainer}>

                {/* Login Method Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, loginMethod === 'phone' && styles.toggleBtnActive]}
                        onPress={() => setLoginMethod('phone')}
                    >
                        <Text style={[styles.toggleText, loginMethod === 'phone' && styles.toggleTextActive]}>Phone</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, loginMethod === 'email' && styles.toggleBtnActive]}
                        onPress={() => setLoginMethod('email')}
                    >
                        <Text style={[styles.toggleText, loginMethod === 'email' && styles.toggleTextActive]}>Email</Text>
                    </TouchableOpacity>
                </View>

                {loginMethod === 'email' ? (
                    <View style={styles.inputContainer}>
                        <Mail size={20} color="#E2E8F0" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            placeholderTextColor="#AAC"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                ) : (
                    <View style={styles.inputContainer}>
                        <Phone size={20} color="#E2E8F0" style={styles.icon} />
                        <Text style={styles.prefixText}>+91</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Mobile Number"
                            placeholderTextColor="#AAC"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="number-pad"
                            maxLength={10}
                        />
                    </View>
                )}

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
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={20} color="#E2E8F0" /> : <Eye size={20} color="#E2E8F0" />}
                    </TouchableOpacity>
                </View>

                {/* Remember Me & Forgot Password Row */}
                <View style={styles.optionsRow}>
                    <TouchableOpacity style={styles.rememberMeContainer} onPress={() => setRememberMe(!rememberMe)}>
                        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                            {rememberMe && <Check size={12} color="#FFF" />}
                        </View>
                        <Text style={styles.rememberMeText}>Remember Me</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { setResetEmail(email); setForgotPwdVisible(true); }}>
                        <Text style={styles.forgotPwdText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSignIn}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <LinearGradient
                            colors={Colors.gradients.button}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>Sign In</Text>
                        </LinearGradient>
                    )}
                </TouchableOpacity>

                {isBiometricEnabled && (
                    <TouchableOpacity
                        style={styles.biometricButton}
                        onPress={handleBiometricLogin}
                        disabled={loading}
                    >
                        <Fingerprint size={24} color="#FFF" />
                        <Text style={styles.biometricText}>Quick Login</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Social Login Removed */}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>New member? </Text>
                    <Link href="/(auth)/signup" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Create Account</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

            </BlurView>

            <View style={styles.kodeSparkFooter}>
                <Text style={styles.poweredByText}>Powered By InfraXpert</Text>
                <Text style={styles.kodeSparkText}>Designed and Developed by KodeSpark</Text>
            </View>

            {/* Forgot Password Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={forgotPwdVisible}
                onRequestClose={() => setForgotPwdVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={90} tint="dark" style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Reset Password</Text>
                            <TouchableOpacity onPress={() => setForgotPwdVisible(false)}>
                                <X size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Enter your email address and we'll send you a link to reset your password.
                        </Text>
                        <Text style={styles.spamNote}>
                            Tip: If you don't see the email within a few minutes, please check your spam folder.
                        </Text>

                        <View style={styles.modalInputContainer}>
                            <Mail size={20} color="#E2E8F0" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#AAC"
                                value={resetEmail}
                                onChangeText={setResetEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { marginTop: 20 }]}
                            onPress={handleResetPassword}
                            disabled={resetLoading}
                        >
                            {resetLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <LinearGradient
                                    colors={Colors.gradients.button}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.buttonText}>Send Reset Link</Text>
                                </LinearGradient>
                            )}
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </Modal>
        </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    poweredByText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
        textAlign: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 5,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 32, // Increased size since logo is gone
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
        textAlign: 'center',
        paddingHorizontal: 20,
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
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    toggleText: {
        color: '#AAA',
        fontWeight: '600',
    },
    toggleTextActive: {
        color: '#FFF',
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
    prefixText: {
        color: '#FFF',
        fontSize: 16,
        marginRight: 8,
        fontWeight: '600',
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    linkText: {
        color: '#FDBA74',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 5,
        textDecorationLine: 'underline',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 4,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rememberMeText: {
        color: '#E2E8F0',
        fontSize: 14,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: Colors.light.primary, // Using primary color
        borderColor: Colors.light.primary,
    },
    forgotPwdText: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dividerText: {
        color: '#CCC',
        paddingHorizontal: 10,
        fontSize: 12,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 10,
    },
    socialBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    socialBtnText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#E2E8F0',
        marginBottom: 12,
        lineHeight: 20,
    },
    spamNote: {
        fontSize: 12,
        color: '#FDBA74', // Match the link color for a "tip" feel
        marginBottom: 24,
        lineHeight: 18,
        fontStyle: 'italic',
        opacity: 0.9,
    },
    modalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 12,
        marginBottom: 10,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    kodeSparkFooter: {
        marginTop: 30,
        alignItems: 'center',
        marginBottom: 20,
    },
    kodeSparkText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        gap: 12,
    },
    biometricText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
