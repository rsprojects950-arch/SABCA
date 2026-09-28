import React, { useRef, useState, useMemo } from 'react';
import { Image } from 'expo-image';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, Alert, ActivityIndicator, Pressable, RefreshControl, Switch, TextInput, Linking, Dimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as MediaLibrary from 'expo-media-library';
import QRCode from 'react-native-qrcode-svg';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, LogOut, QrCode, Share2, Edit3, Smartphone, Mail, Briefcase, MapPin, RefreshCw, Download, FileText, Clock, User, X, FileImage, FileText as FilePdf, AlertTriangle, Eye, EyeOff, Lock, ShieldCheck, Moon, Trash2 } from 'lucide-react-native';

import { Colors } from '../../constants/Colors';
import { useAuth } from '../../ctx/AuthContext';
import { BlurView } from 'expo-blur';
import { supabase } from '../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useBiometrics } from '../../hooks/useBiometrics';
import { Base64Images } from '../../constants/Base64Images';
import { useTheme } from '../../ctx/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../ctx/LanguageContext';
import { Languages } from 'lucide-react-native';
import { signQRCode } from '../../utils/crypto_utils';


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  langText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444', // Attention grabbing red
    borderWidth: 1.5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  securityDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 12,
    height: 50,
    gap: 10,
  },
  passwordInput: {
    flex: 1,
    color: '#1E293B',
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  saveBtn: {
    backgroundColor: Colors.light.primary,
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 24,
  },
  actionBtnPrimary: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnTextPrimary: {
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  actionBtnSecondary: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnTextSecondary: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoListGradient: {
    borderRadius: 22,
    padding: 1.5,
  },
  infoList: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 15,
    color: '#1E293B',
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 24,
  },
  quickGradientBorder: {
    flex: 1,
    borderRadius: 22,
    padding: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  quickSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  poweredByTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginVertical: 12,
    gap: 10,
  },
  poweredByTileText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  poweredByLogo: {
    width: 100,
    height: 30,
  },
  adminEntry: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  singleAction: {
    marginBottom: 24,
  },
  fullWidthCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  adminGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  adminTextContainer: {
    flex: 1,
  },
  adminTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adminSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  adminIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  adminBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  adminBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  renewalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rbExpired: {
    backgroundColor: '#EF4444',
  },
  rbExpiring: {
    backgroundColor: '#F59E0B',
  },
  rbTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rbText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  rbButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  rbButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  idCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  selectedFormat: {
    borderColor: Colors.light.primary,
    backgroundColor: '#F0F9FF',
  },
  formatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  formatDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  downloadBtn: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 12,
  },
  downloadBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  orgName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  orgSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    marginBottom: 20,
    marginTop: 10,
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 8,
  },
  idItem: {
    gap: 2,
  },
  idLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  idValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  renewalAlert: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  renewalText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  renewBtnSmall: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  renewBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    letterSpacing: 1,
  },
  cardDetails: {
    gap: 4,
    alignItems: 'flex-start',
  },
  cardDetailText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  qrContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  qrCodeBox: {
    padding: 6,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
});

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // 20 padding on each side
const mm = (val: number) => (val / 85.6) * CARD_WIDTH;
const pt = (val: number) => (val / 72) * 25.4 * (CARD_WIDTH / 85.6);

export default function ProfileScreen() {
  const { user, isAdmin, userRole, isMembershipActive } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { lightImpact, mediumImpact, successFeedback } = useHaptics();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  // Fetch Profile Data
  const { data: profileData, refetch: refetchProfileData } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, division, phone, sabca_id, membership_type, membership_expiry, status, avatar_url, blood_group, company_name, location, email, gst_number, is_paid_member')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const profile = profileData || null;

  // Fetch Notification Count
  const { data: notifCount, refetch: refetchNotifCount } = useQuery({
    queryKey: ['notifications', 'unread', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Auto-refresh count every 30s
  });

  const notificationCount = notifCount || 0;

  // React Query handles focus revalidation automatically via global config or key invalidation
  useFocusEffect(
    React.useCallback(() => {
      // Optional: Force refetch on focus if needed, or rely on staleTime
      refetchProfileData();
      refetchNotifCount();
    }, [])
  );

  const renewalData = useMemo(() => {
    if (!profile?.membership_expiry) return null;
    const expiry = new Date(profile.membership_expiry);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', days: Math.abs(diffDays) };
    if (diffDays <= 30) return { status: 'expiring', days: diffDays };
    return null;
  }, [profile]);

  // Debugging Renewal Alert


  const qrValue = useMemo(() => {
    const name = profile?.full_name || user?.user_metadata?.full_name || 'Member';
    const mid = profile?.sabca_id || 'PENDING';
    const status = profile?.status || 'Active';
    const sig = user?.id ? signQRCode(mid, user.id, status) : 'UNSIGNED';
    return `SABCA MEMBER PASS\n\nName: ${name}\nID: ${mid}\nStatus: ${status}\nUID: ${user?.id ? user.id.substring(0, 8) : ''}\nSIG: ${sig}`;
  }, [profile, user]);

  const isLifeMember = useMemo(() => {
    return profile?.membership_type?.toLowerCase() === 'life' || profile?.membership_type?.toLowerCase() === 'lifetime';
  }, [profile]);

  // --- Share & Download Logic ---
  const viewShotRef = useRef(null);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'jpg' | 'pdf'>('jpg');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleShare = async () => {
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.9,
      });
      await Sharing.shareAsync(uri);
    } catch (error) {

      Alert.alert('Error', 'Failed to share ID card.');
    }
  };

  const handleDownloadPress = () => {
    setDownloadModalVisible(true);
  };

  const processDownload = async () => {
    setIsProcessing(true);
    try {
      if (selectedFormat === 'jpg') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'We need permission to save to your gallery.');
          setIsProcessing(false);
          return;
        }

        const uri = await captureRef(viewShotRef, {
          format: 'jpg',
          quality: 1,
        });

        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', 'ID Card saved to Gallery!');
        setDownloadModalVisible(false);

      } else {
        // PDF Generation
        const html = generateIdCardHtml(profile, user);
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri); // Share is best way to "save/export" PDF on mobile
        setDownloadModalVisible(false);
      }
    } catch (error) {

      Alert.alert('Error', 'Failed to process download.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestrictedAction = (action: () => void) => {
    if (isMembershipActive) {
      action();
    } else {
      Alert.alert(
        "Membership Expired",
        "Please renew your membership to access this feature.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Renew Now", onPress: () => router.push('/member/renew') }
        ]
      );
    }
  };

  const generateIdCardHtml = (profile: any, user: any) => {
    const name = profile?.full_name || user?.user_metadata?.full_name || 'Member';
    const id = profile?.sabca_id || 'Pending';
    const division = profile?.division || 'Unassigned';
    const isLifeMemberInside = profile?.membership_type?.toLowerCase() === 'life' || profile?.membership_type?.toLowerCase() === 'lifetime';
    const typeDisplay = isLifeMemberInside ? 'LIFETIME' : (profile?.membership_type || 'General').toUpperCase();
    const validUntil = isLifeMemberInside ? 'LIFETIME' : (profile?.membership_expiry ? new Date(profile.membership_expiry).toLocaleDateString() : 'N/A');
    const status = profile?.status || 'Active';
    const statusColor = status === 'Active' ? Colors.light.success : Colors.light.notification;
    // Use a public API for QR code image in PDF since we can't easily inline the React component
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrValue)}`;

    return `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Helvetica:wght@400;500;600;700;800&display=swap');
            body { font-family: 'Helvetica', sans-serif; padding: 20px; display: flex; justify-content: center; align-items: center; height: 100vh; background: #FFF; }
            * { font-family: 'Helvetica', sans-serif; }
            .card { width: 85.6mm; height: 54mm; border-radius: 2mm; border: 0.2mm solid #E2E8F0; position: relative; overflow: hidden; background: #FFF; box-shadow: 0 2mm 5mm rgba(0,0,0,0.1); box-sizing: border-box; }
            .background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
            .content-top { padding: 3mm 4mm 0 4mm; display: flex; z-index: 2; position: relative; height: 55%; box-sizing: border-box; }
            .logo-box { width: 12.7mm; height: 13.4mm; display: flex; justify-content: center; align-items: center; box-sizing: border-box; margin-top: 1mm; }
            .logo-img { width: 100%; height: 100%; object-fit: contain; }
            .watermark { position: absolute; top: 8mm; left: 50%; transform: translateX(-50%); width: 29mm; object-fit: contain; opacity: 0.20; z-index: 1; }
            .user-info { flex: 1; padding: 0 0 0 0.5mm; margin-top: 1mm; height: 13.4mm; display: flex; flex-direction: column; justify-content: center; overflow: hidden; gap: 0.2mm; }
            .user-name { color: #0f4a8a; font-size: 9pt; font-weight: 700; margin: 0; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .user-membership { color: #0f4a8a; font-size: 7pt; font-weight: 400; margin: 0; text-transform: uppercase; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .user-membership strong { font-weight: 700; }
            .user-details { color: #0f4a8a; font-size: 7pt; font-weight: 400; margin: 0; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .user-phone { color: #0f4a8a; font-size: 7pt; font-weight: 400; margin: 0; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .avatar-box { width: 13.5mm; height: 13.5mm; border: 0.15mm solid #175b8e; border-radius: 50%; overflow: hidden; margin-top: 1mm; }
            .avatar-img { width: 100%; height: 100%; object-fit: cover; }
            .content-bottom { position: absolute; bottom: 0; left: 0; width: 100%; padding: 0 4mm 4mm 4mm; box-sizing: border-box; display: flex; justify-content: space-between; align-items: flex-end; z-index: 2; height: 40%; }
            .company-info { flex: 1; color: white; padding-right: 2mm; height: 11.7mm; display: flex; flex-direction: column; justify-content: flex-end; max-width: 58mm; }
            .company-name { font-size: 9pt; font-weight: 700; margin: 0 0 0.5mm 0; letter-spacing: 0.5px; line-height: 1; text-transform: uppercase; }
            .company-location { font-size: 6pt; margin: 0 0 0.2mm 0; line-height: 1.1; font-weight: 600; }
            .company-email { font-size: 6pt; margin: 0; line-height: 1.1; font-weight: 600; }
            .qr-container { width: 13.5mm; height: 11.7mm; display: flex; justify-content: center; align-items: flex-end; box-sizing: border-box; }
            .qr-box { padding: 0.5mm; background: white; border-radius: 0.5mm; display: flex; justify-content: center; align-items: center; width: 11.7mm; height: 11.7mm; box-sizing: border-box; }
            .qr-img { width: 10.7mm; height: 10.7mm; display: block; }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${Base64Images.idBackground}" class="background" />
            <img src="${Base64Images.idWatermark}" class="watermark" />
            <div class="content-top">
              <div class="logo-box">
                <img src="${Base64Images.sabcaLogo}" class="logo-img" />
              </div>
              <div class="user-info">
                <h1 class="user-name">${name}</h1>
                <p class="user-membership"><strong>MEMBER-SABCA</strong> - ${division.split('(')[0].trim()}</p>
                <div class="user-details">
                  ID : ${id} : ${typeDisplay}
                </div>
                <div class="user-phone">
                  ${profile?.phone ? profile.phone.replace(/^(\+91[- ]?)/, '') : ''} : Blood Group : ${profile?.blood_group || 'O+'}
                </div>
              </div>
              <div class="avatar-box">
                <img src="${profile?.avatar_url || 'https://i.pravatar.cc/150?img=12'}" class="avatar-img" />
              </div>
            </div>
            <div class="content-bottom" style="display: flex; flex-direction: row; justify-content: space-between; align-items: flex-end; padding: 0 4mm 3.5mm 4mm; width: 100%; position: absolute; bottom: 0; box-sizing: border-box;">
              <div class="company-info" style="flex: 1; padding-right: 2mm; display: flex; flex-direction: column; justify-content: flex-end; max-width: 58mm;">
                <h2 class="company-name" style="font-weight: 700; letter-spacing: 0.5px; font-size: 9pt; margin-bottom: 0.3mm; color: white; text-transform: uppercase; font-family: Helvetica, sans-serif; margin-top: 0;">${profile?.company_name || 'S R EDIFICE PVT LTD'}</h2>
                <p class="company-location" style="font-size: 6pt; margin-bottom: 0.2mm; opacity: 0.95; line-height: 7pt; font-family: Helvetica, sans-serif; font-weight: 600; margin-top: 0;">${profile?.location || '# 6-120 / 504, Autumn Field Apartment, 3rd Road,<br>Chalasani Nagar, Kanuru,VIJAYAWADA - 520007'}</p>
                <p class="company-email" style="font-size: 6pt; opacity: 0.95; line-height: 7pt; font-family: Helvetica, sans-serif; font-weight: 600; margin-top: 0;">e-mail: ${profile?.email || 'srcvjw@gmail.com, srcvjwd@gmail.com'}</p>
              </div>
              <div class="qr-container" style="display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; width: 11mm; height: 11.7mm;">
                <div class="qr-box" style="width: 11mm; height: 11mm; padding: 0.5mm; background: white; border-radius: 0.5mm; display: flex; justify-content: center; align-items: center;">
                  <img src="${qrUrl}" class="qr-img" style="width: 10mm; height: 10mm; display: block;" />
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  // Refresh Control
  const [refreshing, setRefreshing] = useState(false);
  const { refreshProfile } = useAuth(); // Destructure refreshProfile

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProfileData(),
      refetchNotifCount(),
      refreshProfile?.() // Refresh global auth state
    ]);
    setRefreshing(false);
  }, [user]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >

        {/* ... Header ... */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.title')}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={[styles.langToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={() => {
                lightImpact();
                setLanguage(language === 'en' ? 'te' : 'en');
              }}
            >
              <Text style={[styles.langText, { color: colors.text }]}>
                {language === 'en' ? 'తెలుగు' : 'EN'}
              </Text>
              <Languages size={18} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.card }]}
              onPress={() => {
                lightImpact();
                router.push('/notifications');
              }}
            >
              <Bell color={colors.text} size={24} />
              {notificationCount > 0 && (
                <View style={[styles.badge, { borderColor: colors.card }]}>
                  <Text style={styles.badgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.card }]}
              onPress={() => {
                mediumImpact();
                handleSignOut();
              }}
            >
              <LogOut color={colors.primary} size={24} />
            </TouchableOpacity>
          </View>
        </View>



        {/* Renewal Banner - Visible only if NOT admin and status is expired/expiring */}
        {!isAdmin && renewalData && (
          <View style={[styles.renewalBanner, renewalData.status === 'expired' ? styles.rbExpired : styles.rbExpiring]}>
            <AlertTriangle size={24} color="#FFF" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rbTitle}>
                {renewalData.status === 'expired' ? t('profile.renewal.expired') : t('profile.renewal.expiring')}
              </Text>
              <Text style={styles.rbText}>
                {renewalData.status === 'expired'
                  ? t('profile.renewal.renewDesc')
                  : t('profile.renewal.expiresIn', { days: renewalData.days })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                router.push('/member/renew');
              }}
              style={styles.rbButton}
            >
              <Text style={styles.rbButtonText}>{t('profile.renewal.renew')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Renewal Alert - Striking Banner (Visible to all inactive members except Admins) */}
        {!isAdmin && !isMembershipActive && (
          <TouchableOpacity
            style={styles.adminEntry}
            onPress={() => {
              lightImpact();
              router.push('/member/renew');
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#7f1d1d', '#991b1b', '#b91c1c']} // Keep Dark Red for Expired Alert
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.adminGradient}
            >
              <View style={[styles.adminIconBox, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                <AlertTriangle size={24} color="#FCA5A5" />
              </View>
              <View style={styles.adminTextContainer}>
                <Text style={[styles.adminTitle, { color: '#FCA5A5' }]}>{t('profile.renewal.renewal')}</Text>
                <Text style={[styles.adminSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                  {t('profile.renewal.coordinatorDesc')}
                </Text>
              </View>
              <View style={[styles.adminBadge, { backgroundColor: 'rgba(254, 202, 202, 0.2)', borderColor: 'rgba(254, 202, 202, 0.4)' }]}>
                <Text style={[styles.adminBadgeText, { color: '#FCA5A5' }]}>{t('profile.renewal.renew').toUpperCase()}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Member Card */}
        <View ref={viewShotRef} collapsable={false}>
          <View style={[styles.card, { padding: 0, backgroundColor: '#FFF', width: '100%', aspectRatio: 1.58, overflow: 'hidden' }]}>
            {/* Static Background Image */}
            <Image
              source={require('../../assets/images/id_background_new.png')}
              style={[StyleSheet.absoluteFillObject, { width: undefined, height: undefined, zIndex: 0, transform: [{ scale: 1.03 }] }]}
              resizeMode="stretch"
            />
            {/* Watermark Logos */}
            <Image
              source={require('../../assets/images/ID_Watermark.png')}
              style={{ position: 'absolute', top: '-1%', left: '50%', transform: [{ translateX: -mm(15.6) }], width: mm(36), height: mm(36), opacity: 0.20, zIndex: 1 }}
              resizeMode="contain"
            />
            <View style={{ position: 'absolute', top: '54%', left: '50%', transform: [{ translateX: -mm(9.5) }], flexDirection: 'row', alignItems: 'center', zIndex: 1, opacity: 0.20 }}>
              <Image
                source={require('../../assets/images/handshake_icon.png')}
                style={{ width: mm(5), height: mm(5), transform: [{ translateY: -mm(0.75) }] }}
                resizeMode="contain"
              />
              <Image
                source={require('../../assets/images/infraxpert_watermark_new.jpg')}
                style={{ width: mm(15), height: mm(7), marginLeft: -mm(1) }}
                resizeMode="contain"
              />
            </View>

            {/* Top Section - Logo & Info */}
            <View style={{ flexDirection: 'row', paddingTop: mm(4), paddingLeft: mm(4), paddingRight: 0, height: '55%', zIndex: 2, alignItems: 'flex-start' }}>
              {/* Logo Left */}
              <View style={{ width: mm(12.7), alignItems: 'flex-start', paddingTop: 0, paddingLeft: 0, marginTop: mm(0) }}>
                <View style={{ justifyContent: 'center', alignItems: 'center', width: mm(12.7), height: mm(13.4) }}>
                  <Image
                    source={require('../../assets/images/sabca_new_logo.png')}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Details Middle */}
              <View style={{ flex: 1, paddingLeft: mm(0.5), paddingTop: 0, justifyContent: 'center', marginTop: mm(0), height: mm(13.4), gap: mm(0.2) }}>
                <Text style={{ color: '#0f4a8a', fontSize: pt(9), fontWeight: '700', fontFamily: 'Helvetica' }} numberOfLines={1}>
                  {profile?.full_name || user?.user_metadata?.full_name || 'Member Name'}
                </Text>

                {profile?.division ? (
                  <View>
                    <Text style={{ color: '#0f4a8a', fontSize: pt(7), fontFamily: 'Helvetica' }} numberOfLines={1}>
                      <Text style={{ fontWeight: '700', fontFamily: 'Helvetica' }}>MEMBER-SABCA</Text>
                      <Text style={{ fontWeight: '400', fontFamily: 'Helvetica' }}> - {profile.division.split('(')[0].trim()}</Text>
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: '#0f4a8a', fontSize: pt(7), fontWeight: '700', fontFamily: 'Helvetica' }} numberOfLines={1}>
                    MEMBER-SABCA
                  </Text>
                )}

                <Text style={{ color: '#0f4a8a', fontSize: pt(7), fontWeight: '400', fontFamily: 'Helvetica' }} numberOfLines={1}>
                  ID : {profile?.sabca_id || 'PENDING'} : {isLifeMember ? 'LIFE TIME' : (profile?.membership_type || 'GENERAL').toUpperCase()}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#0f4a8a', fontSize: pt(8.5), fontWeight: '400', marginRight: mm(1), fontFamily: 'Helvetica' }} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>
                    {profile?.phone ? profile.phone.replace(/^(\+91[- ]?)/, '') : ''} : Blood Group : {profile?.blood_group || 'O+'}
                  </Text>
                </View>
              </View>

              {/* Avatar Right */}
              <View style={{ width: mm(13.5), alignItems: 'flex-end', paddingTop: 0, marginTop: mm(0), marginRight: mm(4) }}>
                <Image
                  source={profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?img=12'}
                  style={{ width: mm(13.5), height: mm(13.5), borderRadius: mm(13.5) / 2, borderWidth: mm(0.15), borderColor: '#175b8e', backgroundColor: '#E2E8F0' }}
                  contentFit="cover"
                  transition={500}
                />
              </View>
            </View>

            {/* Spacer to push bottom section down */}
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: mm(3.5), paddingLeft: mm(4), paddingRight: mm(4), width: '100%', position: 'absolute', bottom: 0, zIndex: 2 }}>
              <View style={{ flex: 1, paddingRight: mm(2), height: mm(11.7), flexDirection: 'column', justifyContent: 'flex-end', maxWidth: mm(58) }}>
                <Text style={{ color: '#FFF', fontSize: pt(9), fontWeight: '700', letterSpacing: 0.5, marginBottom: mm(0.3), textTransform: 'uppercase', fontFamily: 'Helvetica' }} numberOfLines={1}>
                  {profile?.company_name || 'S R EDIFICE PVT LTD'}
                </Text>
                <Text style={{ color: '#FFF', fontSize: pt(6), marginBottom: mm(0.2), opacity: 0.95, lineHeight: pt(7), fontFamily: 'Helvetica', fontWeight: '600' }} numberOfLines={2}>
                  {profile?.location || '# 6-120 / 504, Autumn Field Apartment, 3rd Road,\nChalasani Nagar, Kanuru, VIJAYAWADA - 520007'}
                </Text>
                {profile?.email && (
                  <Text style={{ color: '#FFF', fontSize: pt(6), opacity: 0.95, lineHeight: pt(7), fontFamily: 'Helvetica', fontWeight: '600' }}>
                    e-mail: {profile?.email || 'srcvjw@gmail.com, srcvjwd@gmail.com'}
                  </Text>
                )}
              </View>

              <View style={{ width: mm(11), height: mm(11.7), alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  onPress={() => {
                    lightImpact();
                    handleRestrictedAction(() => router.push('/member/qr-access'));
                  }}
                  activeOpacity={0.8}
                  style={{ width: mm(11), height: mm(11) }}
                >
                  <View style={{ backgroundColor: '#FFF', padding: mm(0.5), borderRadius: mm(0.5), width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <QRCode
                      value={qrValue}
                      size={mm(10)}
                      color="black"
                      backgroundColor="white"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Powered By Text */}
        <PoweredByTile />

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => {
              lightImpact();
              router.push('/member/edit-profile');
            }}
          >
            <LinearGradient
              colors={['#F1F5F9', '#E2E8F0']} // Keep light for now or adapt? Let's leave static or use opacity
              style={styles.actionBtnGradient}
            >
              <Edit3 size={18} color={colors.primary} />
              <Text style={[styles.actionBtnTextPrimary, { color: colors.primary }]}>{t('buttons.editProfile')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnSecondary, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              lightImpact();
              handleShare();
            }}
          >
            <Share2 size={18} color={colors.text} />
            <Text style={[styles.actionBtnTextSecondary, { color: colors.text }]}>{t('common.share')}</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Console Entry - Only visual for Admins */}
        {/* Admin Console Entry - Only visual for Admins */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminEntry}
            onPress={() => {
              mediumImpact();
              router.push('/admin/dashboard');
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#1e1b4b', '#312e81', '#4338ca']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.adminGradient}
            >
              <View style={styles.adminIconBox}>
                <Briefcase size={24} color="#FFD700" />
              </View>
              <View style={styles.adminTextContainer}>
                <Text style={styles.adminTitle}>{userRole === 'admin' ? t('admin.console') : t('admin.panel')}</Text>
                <Text style={styles.adminSubtitle}>{t('admin.actions.createNewContentDesc')}</Text>
              </View>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ACCESS</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.personalInfo')}</Text>
          <LinearGradient
            colors={Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoListGradient}
          >
            <View style={[styles.infoList, { backgroundColor: colors.card }]}>
              <InfoItem icon={Smartphone} label={profile?.phone || "+91 98765 43210"} color={colors.text} iconColor={colors.icon} />
              <InfoItem icon={Mail} label={user?.email || "email@example.com"} color={colors.text} iconColor={colors.icon} />
              <InfoItem icon={Briefcase} label={profile?.company_name || "Add Company Name"} color={colors.text} iconColor={colors.icon} />
              <InfoItem icon={MapPin} label={profile?.location || "Add Location"} color={colors.text} iconColor={colors.icon} />
              <InfoItem icon={FileText} label={profile?.gst_number || "Add GST Number"} color={colors.text} iconColor={colors.icon} />
            </View>
          </LinearGradient>
        </View>

        {/* Membership Features Grid */}
        <View style={[styles.section, { marginBottom: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.membershipFeatures')}</Text>
          <View style={styles.grid}>
            <QuickActionCard
              icon={RefreshCw}
              title={t('profile.renewContribute')}
              color="#F59E0B"
              onPress={() => router.push('/member/renew')}
              textColor={colors.text}
              subtitleColor={colors.icon}
              cardBg={colors.card}
            />
            <QuickActionCard icon={Download} title={t('common.download')} subtitle={t('profile.idCard')} color="#10B981" onPress={() => handleRestrictedAction(handleDownloadPress)} textColor={colors.text} subtitleColor={colors.icon} cardBg={colors.card} />
          </View>
          <View style={[styles.grid, { marginBottom: 0 }]}>
            <QuickActionCard
              icon={FileText}
              title={t('common.documents')}
              subtitle={t('profile.viewUploads')}
              color="#3B82F6"
              onPress={() => handleRestrictedAction(() => router.push('/member/documents'))}
              textColor={colors.text}
              subtitleColor={colors.icon}
              cardBg={colors.card}
            />
            <QuickActionCard
              icon={Clock}
              title={t('common.history')}
              subtitle={t('profile.transactions')}
              color={colors.secondary}
              onPress={() => handleRestrictedAction(() => router.push('/member/history'))}
              textColor={colors.text}
              subtitleColor={colors.icon}
              cardBg={colors.card}
            />
          </View>
        </View>

        {/* Security Section with Biometrics */}
        <SecuritySection />



        {/* Bottom Spacer for Tab Bar */}
        <View style={{ height: 120 }} />

      </ScrollView>

      {/* Download Options Modal */}
      <Modal
        visible={downloadModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDownloadModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDownloadModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profile.downloadId.title')}</Text>
              <TouchableOpacity onPress={() => setDownloadModalVisible(false)}>
                <X size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.icon }]}>{t('profile.downloadId.subtitle')}</Text>

            <TouchableOpacity
              style={[styles.formatOption, { backgroundColor: colors.background, borderColor: colors.border }, selectedFormat === 'jpg' && { borderColor: colors.primary, backgroundColor: `${colors.primary} 10` }]}
              onPress={() => setSelectedFormat('jpg')}
            >
              <View style={styles.formatLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                  <FileImage size={24} color="#0284C7" />
                </View>
                <View>
                  <Text style={[styles.formatTitle, { color: colors.text }]}>{t('profile.downloadId.image')}</Text>
                  <Text style={[styles.formatDesc, { color: colors.icon }]}>{t('profile.downloadId.imageDesc')}</Text>
                </View>
              </View>
              {selectedFormat === 'jpg' ? <CheckCircle2 size={24} color={colors.primary} /> : <Circle size={24} color={colors.border} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.formatOption, { backgroundColor: colors.background, borderColor: colors.border }, selectedFormat === 'pdf' && { borderColor: colors.primary, backgroundColor: `${colors.primary} 10` }]}
              onPress={() => setSelectedFormat('pdf')}
            >
              <View style={styles.formatLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                  <FilePdf size={24} color="#DC2626" />
                </View>
                <View>
                  <Text style={[styles.formatTitle, { color: colors.text }]}>{t('profile.downloadId.pdf')}</Text>
                  <Text style={[styles.formatDesc, { color: colors.icon }]}>{t('profile.downloadId.pdfDesc')}</Text>
                </View>
              </View>
              {selectedFormat === 'pdf' ? <CheckCircle2 size={24} color={colors.primary} /> : <Circle size={24} color={colors.border} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
              onPress={processDownload}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Download size={20} color="#FFF" />
                  <Text style={styles.downloadBtnText}>
                    {t('profile.downloadId.downloadFormat', { format: selectedFormat.toUpperCase() })}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView >
  );
}



const SecuritySection = () => {
  const { isBiometricEnabled, setBiometricEnabled, user, deleteAccount } = useAuth();
  const { isBiometricSupported, isBiometricEnrolled, authenticate } = useBiometrics();
  const { colors, isDark, toggleTheme } = useTheme();
  const { mediumImpact, heavyImpact } = useHaptics();
  const { t } = useTranslation();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Delete Account State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    heavyImpact();
    setDeletingAccount(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        Alert.alert(t('common.error'), error.message || 'Failed to delete account');
        return;
      }
      setDeleteModalVisible(false);
      Alert.alert(t('common.success'), t('profile.dangerZone.deleteSuccess'), [
        {
          text: t('common.ok'),
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || 'An unexpected error occurred');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    if (value) {
      if (!isBiometricSupported || !isBiometricEnrolled) {
        Alert.alert(t('profile.security.notSupported'), t('profile.security.notSupportedDesc'));
        return;
      }
      setModalVisible(true);
    } else {
      await setBiometricEnabled(false);
      Alert.alert(t('profile.security.disabled'), t('profile.security.disabledDesc'));
    }
  };

  const verifyAndPasswordSave = async () => {
    if (!password) {
      Alert.alert(t('common.error'), t('profile.security.verifySubtitle'));
      return;
    }

    setVerifying(true);
    try {
      // Verify password with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: password,
      });

      if (error) throw error;

      // Authenticate with Biometrics
      const success = await authenticate('Enable Biometric Login');
      if (success) {
        await setBiometricEnabled(true, { email: user?.email || '', pass: password });
        setModalVisible(false);
        setPassword('');
        Alert.alert(t('common.success'), t('profile.security.successEnabled'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), t('profile.security.incorrectPassword'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.settings')}</Text>
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.infoListGradient}
      >
        <View style={[styles.infoList, { backgroundColor: colors.card }]}>
          <View style={styles.securityItem}>
            <View style={[styles.infoIconBox, { backgroundColor: colors.background }]}>
              <ShieldCheck size={20} color={isBiometricEnabled ? Colors.light.success : colors.icon} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.securityTitle, { color: colors.text }]}>{t('profile.biometricLogin')}</Text>
              <Text style={[styles.securityDesc, { color: colors.icon }]}>Use FaceID or Fingerprint to log in</Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: '#BFDBFE' }}
              thumbColor={isBiometricEnabled ? colors.primary : '#F4F4F5'}
              ios_backgroundColor={colors.border}
            />
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

          <View style={styles.securityItem}>
            <View style={[styles.infoIconBox, { backgroundColor: colors.background }]}>
              <Moon size={20} color={isDark ? '#F59E0B' : colors.icon} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.securityTitle, { color: colors.text }]}>{t('profile.darkMode')}</Text>
              <Text style={[styles.securityDesc, { color: colors.icon }]}>Switch between light and dark themes</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: '#BFDBFE' }}
              thumbColor={isDark ? colors.primary : '#F4F4F5'}
              ios_backgroundColor={colors.border}
            />
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

          {/* Delete Account (Self-Service) */}
          <TouchableOpacity
            style={styles.securityItem}
            onPress={() => {
              mediumImpact();
              setDeleteModalVisible(true);
            }}
          >
            <View style={[styles.infoIconBox, { backgroundColor: colors.background }]}>
              <Trash2 size={20} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.securityTitle, { color: '#DC2626', fontWeight: '600' }]}>
                {t('profile.dangerZone.deleteAccount')}
              </Text>
              <Text style={[styles.securityDesc, { color: colors.icon }]}>
                {t('profile.dangerZone.deleteDesc')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Password Verification Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profile.security.verifyTitle')}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.icon }]}>{t('profile.security.verifySubtitle')}</Text>

            <View style={[styles.passwordInputContainer, { backgroundColor: colors.background }]}>
              <Lock size={18} color={colors.icon} />
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder={t('profile.security.passwordPlaceholder')}
                placeholderTextColor={colors.icon}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color={colors.icon} /> : <Eye size={20} color={colors.icon} />}
              </TouchableOpacity>
            </View>

            <View style={[styles.modalActions, { marginTop: 20 }]}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: colors.background }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.icon }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={verifyAndPasswordSave}
                disabled={verifying}
              >
                {verifying ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{t('buttons.verify')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => !deletingAccount && setDeleteModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <AlertTriangle size={30} color="#DC2626" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center' }]}>
                {t('profile.dangerZone.confirmTitle')}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.icon, textAlign: 'center', marginTop: 6, lineHeight: 20 }]}>
                {t('profile.dangerZone.confirmMessage')}
              </Text>
            </View>

            <View style={{ marginTop: 20, width: '100%', gap: 12 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#DC2626',
                  width: '100%',
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
                activeOpacity={0.8}
              >
                {deletingAccount ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 15 }}>
                      {t('profile.dangerZone.deleting', 'Deleting account...')}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15, textAlign: 'center' }}>
                    {t('profile.dangerZone.confirmButton', 'Delete Account Permanently')}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                  width: '100%',
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deletingAccount}
                activeOpacity={0.8}
              >
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15, textAlign: 'center' }}>
                  {t('common.cancel', 'Cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};


const UserAvatar = ({ url, name }: { url?: string, name?: string }) => {
  if (url) {
    return <Image source={{ uri: url }} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' }} />;
  }

  const getInitials = (n?: string) => {
    if (!n) return 'M';
    const parts = n.trim().split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return 'M';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}>
      <Text style={{ fontSize: 24, color: '#FFF' }}>{getInitials(name)}</Text>
    </View>
  );
};

const InfoItem = ({ icon: Icon, label, color, iconColor }: any) => (
  <View style={styles.infoItem}>
    <View style={styles.infoIconBox}>
      <Icon size={18} color={iconColor || Colors.light.icon} />
    </View>
    <Text style={[styles.infoText, { color: color || Colors.light.text }]}>{label}</Text>
  </View>
);

const QuickActionCard = ({ icon: Icon, title, subtitle, color, onPress, textColor, subtitleColor, cardBg }: any) => {
  const { lightImpact } = useHaptics();
  return (
    <LinearGradient
      colors={Colors.gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.quickGradientBorder}
    >
      <TouchableOpacity
        style={[styles.quickCard, { backgroundColor: cardBg || '#FFF' }]}
        onPress={() => {
          lightImpact();
          onPress();
        }}
      >
        <View style={[styles.quickIconCircle, { backgroundColor: `${color} 20` }]}>
          <Icon size={24} color={color} />
        </View>
        <View>
          <Text style={[styles.quickTitle, { color: textColor || Colors.light.text }]}>{title}</Text>
          <Text style={[styles.quickSubtitle, { color: subtitleColor || Colors.light.icon }]}>{subtitle}</Text>
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const PoweredByTile = () => {
  const { lightImpact } = useHaptics();
  return (
    <TouchableOpacity
      onPress={() => {
        lightImpact();
        Linking.openURL('https://infraxpert.com');
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#170020', '#4A3D68', '#541570']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        locations={[0, 1, 1]}
        style={styles.poweredByTile}
      >
        <Text style={styles.poweredByTileText}>Powered By</Text>
        <Image
          source={require('../../assets/images/infraxpert_logo.png')}
          style={styles.poweredByLogo}
          contentFit="contain"
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};


