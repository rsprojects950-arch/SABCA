import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';

export const useBiometrics = () => {
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);

    useEffect(() => {
        (async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            setIsBiometricSupported(compatible);

            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setIsBiometricEnrolled(enrolled);
        })();
    }, []);

    const authenticate = async (reason: string = 'Confirm your identity') => {
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

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: reason,
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
        authenticate,
    };
};
