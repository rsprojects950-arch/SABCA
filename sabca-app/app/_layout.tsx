import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';

import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../ctx/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { ToastProvider } from '../ctx/ToastContext';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';
import { ThemeProvider } from '../ctx/ThemeContext';

import { LanguageProvider } from '../ctx/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../lib/i18n';

const InitialLayout = () => {
  const { session, isLoading, isProfileComplete } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isResetPassword = segments[1] === 'reset-password';
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!session && !inAuthGroup) {
      // Not logged in -> Login
      router.replace('/(auth)/login');
    } else if (session) {
      if (!isProfileComplete) {
        // Logged in but profile incomplete -> Onboarding
        if (!inOnboardingGroup) {
          router.replace('/onboarding');
        }
      } else if ((inAuthGroup || inOnboardingGroup) && !isResetPassword) {
        // Logged in and complete -> Tabs
        router.replace('/(tabs)');
      }
    }
  }, [session, isLoading, isProfileComplete, segments]);

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
  useEffect(() => {
    // (Now handled by Server-Side Cron Job - 049_server_automation.sql)
    
    // 3. Handle Deep Links for Auth (e.g. Password Reset)
    const handleUrl = (url: string) => {
      // Supabase often puts tokens in the hash (#) instead of query (?)
      const { queryParams, hostname, path } = Linking.parse(url);

      let access_token = queryParams?.access_token as string;
      let refresh_token = queryParams?.refresh_token as string;

      // Extract from hash if not in query
      if (!access_token && url.includes('#')) {
        const hash = url.split('#')[1];
        const params = new URLSearchParams(hash);
        access_token = params.get('access_token') || '';
        refresh_token = params.get('refresh_token') || '';
      }

      if (access_token) {
        supabase.auth.setSession({
          access_token: access_token,
          refresh_token: refresh_token || '',
        });
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);


  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <StatusBar style="auto" />
              <InitialLayout />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
