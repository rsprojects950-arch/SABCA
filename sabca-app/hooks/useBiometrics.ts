import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';

export const useBiometrics = () => {
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);
    const [biometricType, setBiometricType] = useState<string>('Biometrics');

    useEffect(() => {
        (async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            setIsBiometricSupported(compatible);

            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setIsBiometricEnrolled(enrolled);

            try {
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                    setBiometricType('Face ID');
                } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                    setBiometricType(Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint');
                } else {
                    setBiometricType('Biometrics');
                }
            } catch {
                setBiometricType('Biometrics');
            }
        })();
    }, []);

    const authenticate = async (reason?: string) => {
        try {
            // Re-verify support in real-time to avoid race conditions on app startup
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();

            // Update state for future calls
            setIsBiometricSupported(compatible);
            setIsBiometricEnrolled(enrolled);

            if (!compatible) {
                throw new Error('Biometric authentication is not supported on this device.');
            }

            if (!enrolled) {
                throw new Error('No biometrics enrolled on this device. Please set up Face Unlock or Fingerprint in your device settings.');
            }

            const promptMessage = reason || `Sign in with ${biometricType}`;

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                fallbackLabel: 'Enter Password',
                disableDeviceFallback: false,
                cancelLabel: 'Cancel',
            });

            return result.success;
        } catch (error: any) {
            console.warn('Biometric Auth Error:', error);
            Alert.alert('Authentication Failed', error.message);
            return false;
        }
    };

    return {
        isBiometricSupported,
        isBiometricEnrolled,
        biometricType,
        authenticate,
    };
};
