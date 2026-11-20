import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';

import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../ctx/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { ToastProvider } from '../ctx/ToastContext';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';
import { ThemeProvider } from '../ctx/ThemeContext';

import { LanguageProvider } from '../ctx/LanguageContext';
import { ModerationProvider } from '../ctx/ModerationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../lib/i18n';

const InitialLayout = () => {
  const {
    session,
    isLoading,
    isProfileComplete,
    isPasswordRecovery,
    isProcessingRecoveryLink,
    processAuthDeepLink,
  } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const linkingUrl = Linking.useLinkingURL();

  useEffect(() => {
    if (linkingUrl) {
      void processAuthDeepLink(linkingUrl);
    }
  }, [linkingUrl, processAuthDeepLink]);

  useEffect(() => {
    // Handle deep links for auth (e.g. Password Reset) across iOS SceneDelegate & Android
    const initialLinkingUrl = Linking.getLinkingURL();
    if (initialLinkingUrl) {
      void processAuthDeepLink(initialLinkingUrl);
    }

    Linking.getInitialURL().then((url) => {
      if (url) {
        void processAuthDeepLink(url);
      }
    });

    const subscription = Linking.addEventListener('url', (event) => {
      void processAuthDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [processAuthDeepLink]);

  useEffect(() => {
    if (isLoading) return;

    const segmentList = segments as string[];
    const inAuthGroup = segmentList[0] === '(auth)';
    const isResetPassword = segmentList[1] === 'reset-password';
    const isPublicLegal = segmentList[1] === 'privacy' || segmentList[1] === 'terms';
    const inOnboardingGroup = segmentList[0] === 'onboarding';

    if (isPasswordRecovery || isProcessingRecoveryLink) {
      if (!isResetPassword) {
        router.replace('/(auth)/reset-password');
      }
      return;
    }

    if (!session && !inAuthGroup) {
      // Not logged in -> Login
      router.replace('/(auth)/login');
    } else if (session) {
      if (!isProfileComplete) {
        // Logged in but profile incomplete -> Onboarding
        if (!inOnboardingGroup) {
          router.replace('/onboarding');
        }
      } else if ((inAuthGroup || inOnboardingGroup) && !isResetPassword && !isPublicLegal) {
        // Logged in and complete -> Tabs
        router.replace('/(tabs)');
      }
    }
  }, [session, isLoading, isProfileComplete, isPasswordRecovery, isProcessingRecoveryLink, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.primary }}>
        <ActivityIndicator size="large" color={Colors.light.secondary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ModerationProvider>
                <StatusBar style="auto" />
                <InitialLayout />
              </ModerationProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
