import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../ctx/AuthContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';

import { useTheme } from '../../ctx/ThemeContext';

export default function AdminLayout() {
    const { user, isAdmin, isLoading } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || !isAdmin)) {
            router.replace('/(tabs)');
        }
    }, [user, isAdmin, isLoading]);

    if (isLoading || !isAdmin) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="dashboard" options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="create-hub" options={{ title: 'Create Content', presentation: 'modal' }} />
            <Stack.Screen name="create-event" options={{ title: 'Create Event' }} />
            <Stack.Screen name="create-news" options={{ title: 'Create News' }} />
            <Stack.Screen name="users" options={{ title: 'Manage Users' }} />
        </Stack>
    );
}
