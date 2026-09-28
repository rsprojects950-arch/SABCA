import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { BlurView } from 'expo-blur';
import { Home, Users, Calendar, Briefcase, User } from 'lucide-react-native';
import { HapticTab } from '../../components/haptic-tab';
import { useAuth } from '../../ctx/AuthContext';
import { useTheme } from '../../ctx/ThemeContext';
import { useTranslation } from 'react-i18next';

const GlassBackground = React.memo(({ isDark }: { isDark: boolean }) => {
  if (Platform.OS === 'android') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? 'rgba(17, 18, 20, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }}
      />
    );
  }

  return (
    <BlurView
      intensity={100}
      tint={isDark ? 'dark' : 'light'}
      style={{
        flex: 1,
        backgroundColor: isDark ? 'rgba(17, 18, 20, 0.65)' : 'rgba(255,255,255,0.65)',
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)',
        borderTopWidth: 1,
        overflow: 'hidden',
      }}
    />
  );
});

export default function TabLayout() {
  const { isMembershipActive } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const tabHeight = Platform.OS === 'ios' ? 85 : 65 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: tabHeight,
          paddingBottom: Platform.OS === 'ios' ? 25 : Math.max(insets.bottom, 8),
          backgroundColor: 'transparent',
        },
        tabBarButton: HapticTab,
        tabBarBackground: () => <GlassBackground isDark={isDark} />,
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="sabca"
        listeners={{
          tabPress: (e) => {
            if (!isMembershipActive) {
              e.preventDefault();
              Alert.alert(
                t('profile.renewal.expired'),
                t('profile.renewal.renewDesc'),
                [
                  { text: t('common.cancel'), style: "cancel" },
                  { text: t('common.renew'), onPress: () => router.push('/member/renew') }
                ]
              );
            }
          },
        }}
        options={{
          title: t('tabs.sabca'),
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t('tabs.events'),
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        listeners={{
          tabPress: (e) => {
            if (!isMembershipActive) {
              e.preventDefault();
              Alert.alert(
                t('profile.renewal.expired'),
                t('profile.renewal.renewDesc'),
                [
                  { text: t('common.cancel'), style: "cancel" },
                  { text: t('common.renew'), onPress: () => router.push('/member/renew') }
                ]
              );
            }
          },
        }}
        options={{
          title: t('tabs.services'),
          tabBarIcon: ({ color }) => <Briefcase size={24} color={color} />,
        }}
      />

    </Tabs>
  );
}
