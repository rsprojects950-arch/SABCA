import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../ctx/ThemeContext';
import { useAuth } from '../../ctx/AuthContext';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifyingSession, setVerifyingSession] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { session, isLoading: authLoading } = useAuth();

    const { code } = useLocalSearchParams();

    useEffect(() => {
        if (!authLoading) {
            if (session) {
                setVerifyingSession(false);
            } else {
                // Wait a bit more for background sync
                const timer = setTimeout(() => {
                    if (!session) {
                        Alert.alert(
                            'Auth session missing!',
                            'We could not verify your reset link. Please try requesting a new one from the Login screen.',
                            [{ text: 'Go to Login', onPress: () => router.replace('/(auth)/login') }]
                        );
                    }
                    setVerifyingSession(false);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [session, authLoading]);

    const handleUpdatePassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Your password has been updated!');
            router.replace('/(auth)/login');
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen options={{
                headerShown: true,
                title: 'Reset Password',
                headerTransparent: true,
                headerTintColor: '#FFF',
                headerBackTitle: 'Login'
            }} />
            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B', '#1E293B'] : Colors.gradients.primary}
                style={styles.background}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>New Password</Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#E2E8F0' }]}>Create a strong new password</Text>
                </View>

                <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={[styles.formContainer, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.1)' }]}>
                    {verifyingSession ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFF" />
                            <Text style={styles.loadingText}>Verifying session...</Text>
                        </View>
                    ) : (
                        <>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(17, 18, 20, 0.6)' : 'rgba(0, 0, 0, 0.2)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)' }]}>
                                <Lock size={20} color={isDark ? '#64748B' : '#E2E8F0'} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="New Password"
                                    placeholderTextColor={isDark ? '#475569' : '#AAC'}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    {showPassword ? <EyeOff size={20} color={isDark ? '#64748B' : '#E2E8F0'} /> : <Eye size={20} color={isDark ? '#64748B' : '#E2E8F0'} />}
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(17, 18, 20, 0.6)' : 'rgba(0, 0, 0, 0.2)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)' }]}>
                                <Lock size={20} color={isDark ? '#64748B' : '#E2E8F0'} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    placeholderTextColor={isDark ? '#475569' : '#AAC'}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleUpdatePassword}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <LinearGradient
                                        colors={isDark ? ['#3B82F6', '#2563EB'] : Colors.gradients.button}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.gradientButton}
                                    >
                                        <Text style={styles.buttonText}>Update Password</Text>
                                    </LinearGradient>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </BlurView>
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
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 5,
    },
    formContainer: {
        marginHorizontal: 30,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        height: '100%', // Ensure consistent height
        paddingVertical: 0, // Fix jitter on some Android versions
    },
    eyeIcon: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 32, // Prevent layout shift
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        color: '#FFF',
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
    },
    button: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
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
});
