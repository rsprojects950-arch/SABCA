import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../../constants/Colors';
import { Download, Share2, ShieldCheck, Link2 } from 'lucide-react-native';
import { useAuth } from '../../../ctx/AuthContext';
import { supabase } from '../../../lib/supabase';
import QRCode from 'react-native-qrcode-svg';
import { signQRCode } from '../../../utils/crypto_utils';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // 20 padding on each side
// Proportional converters based on 85.6mm physical width
const mm = (val: number) => (val / 85.6) * CARD_WIDTH;
const pt = (val: number) => (val / 72) * 25.4 * (CARD_WIDTH / 85.6);

export default function DigitalIDCardScreen() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const viewShotRef = useRef<any>(null); // Use any to avoid type issues with ViewShot ref
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
    const [qrValue, setQrValue] = useState('Loading...');

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user!.id)
                .single();

            if (data) {
                setProfile(data);
                generateQRData(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const generateQRData = (p: any) => {
        const name = p.full_name || 'Member';
        const mid = p.sabca_id || 'PENDING';
        const status = p.status || 'Active';
        const sig = signQRCode(mid, user!.id, status);
        const readableString = `SABCA MEMBER PASS\n\nName: ${name}\nID: ${mid}\nStatus: ${status}\nUID: ${user!.id.substring(0, 8)}\nSIG: ${sig}`;
        setQrValue(readableString);
    };

    const handleShare = async () => {
        try {


            // Wait a tick to ensure ref is ready? usually ok.
            if (!viewShotRef.current || !viewShotRef.current.capture) {
                Alert.alert("Error", "Card view not ready for capture. Please try again in a moment.");
                return;
            }

            // 1. Capture using ViewShot component method
            const uri = await viewShotRef.current.capture();


            // 2. Check Share Availability
            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert("Not Supported", "Sharing is not available on this device");
                return;
            }

            // 3. Share
            await Sharing.shareAsync(uri);

        } catch (error: any) {
            console.error("Share error details:", error);
            Alert.alert('Share Failed', error.message || 'Unknown error occurred during share.');
        }
    };

    const handleDownload = async () => {
        try {
            // Android Permission Check
            if (Platform.OS === 'android') {
                if (permissionResponse?.status !== 'granted') {
                    const { status } = await requestPermission();
                    if (status !== 'granted') {
                        // Fallback to share
                        Alert.alert(
                            'Permission Required',
                            'Gallery permission denied. Opening share options instead.',
                            [
                                { text: 'Share', onPress: handleShare },
                                { text: 'Cancel', style: 'cancel' }
                            ]
                        );
                        return;
                    }
                }
            }

            if (viewShotRef.current && viewShotRef.current.capture) {
                // Capture PNG for download (better quality)
                const uri = await viewShotRef.current.capture({ format: "png", quality: 1 });


                if (Platform.OS === 'android') {
                    try {
                        await MediaLibrary.saveToLibraryAsync(uri);
                        Alert.alert('Saved!', 'ID Card saved to Gallery.');
                    } catch (e) {
                        handleShare();
                    }
                } else {
                    await Sharing.shareAsync(uri);
                }
            }
        } catch (error: any) {
            console.error("Download error", error);
            handleShare(); // Fallback
        }
    };

    const avatarSource = profile?.avatar_url
        ? { uri: profile.avatar_url }
        : { uri: 'https://i.pravatar.cc/300?img=11' }; // Fallback

    // Ensure profile mapping for isLifeMember which was missing
    const isLifeMember = profile?.membership_type?.toLowerCase() === 'life' || profile?.membership_type?.toLowerCase() === 'lifetime';

    return (
        <View style={styles.container}>
            <View style={styles.content}>

                {/* ViewShot Component Wrapper */}
                <ViewShot
                    ref={viewShotRef}
                    options={{ format: 'png', quality: 1.0 }}
                    style={styles.cardContainer}
                >
                    <View style={styles.idCard}>
                        {/* Static Background Image */}
                        <Image
                            source={require('../../../assets/images/id_background_new.png')}
                            style={[styles.cardBackgroundImage, { transform: [{ scale: 1.03 }] }]}
                            resizeMode="stretch"
                        />
                        {/* Watermark Logos */}
                        <Image
                            source={require('../../../assets/images/ID_Watermark.png')}
                            style={{ position: 'absolute', top: '-1%', left: '50%', transform: [{ translateX: -mm(15.6) }], width: mm(36), height: mm(36), opacity: 0.20, zIndex: 1 }}
                            resizeMode="contain"
                        />
                        <View style={{ position: 'absolute', top: '54%', left: '50%', transform: [{ translateX: -mm(9.5) }], flexDirection: 'row', alignItems: 'center', zIndex: 1, opacity: 0.20 }}>
                            <Image
                                source={require('../../../assets/images/handshake_icon.png')}
                                style={{ width: mm(5), height: mm(5), transform: [{ translateY: -mm(0.75) }] }}
                                resizeMode="contain"
                            />
                            <Image
                                source={require('../../../assets/images/infraxpert_watermark_new.jpg')}
                                style={{ width: mm(15), height: mm(7), marginLeft: -mm(1) }}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Top Section - Logo & Info */}
                        <View style={[styles.topSection, { alignItems: 'flex-start', paddingLeft: mm(4), paddingRight: 0 }]}>
                            {/* Logo Left */}
                            <View style={[styles.logoArea, { paddingTop: 0 }]}>
                                <View style={{ justifyContent: 'center', alignItems: 'center', width: mm(12.7), height: mm(13.4) }}>
                                    <Image
                                        source={require('../../../assets/images/sabca_new_logo.png')}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>

                            {/* Details Middle */}
                            <View style={[styles.detailsArea, { paddingLeft: mm(0.5), paddingTop: 0, justifyContent: 'center', height: mm(13.4), gap: mm(0.2) }]}>
                                <Text style={[styles.memberName, { color: '#0f4a8a', fontWeight: '700', fontSize: pt(9), fontFamily: 'Helvetica' }]} numberOfLines={1}>
                                    {profile?.full_name || 'Member Name'}
                                </Text>

                                {profile?.division ? (
                                    <View>
                                        <Text style={[styles.memberRole, { color: '#0f4a8a', fontSize: pt(7), fontFamily: 'Helvetica' }]} numberOfLines={1}>
                                            <Text style={{ fontWeight: '700', fontFamily: 'Helvetica' }}>MEMBER-SABCA</Text>
                                            <Text style={{ fontWeight: '400', fontFamily: 'Helvetica' }}> - {profile.division.split('(')[0].trim()}</Text>
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={[styles.memberRole, { color: '#0f4a8a', fontWeight: '700', fontSize: pt(7), fontFamily: 'Helvetica' }]} numberOfLines={1}>
                                        MEMBER-SABCA
                                    </Text>
                                )}

                                <Text style={[styles.memberId, { color: '#0f4a8a', fontWeight: '400', fontSize: pt(7), fontFamily: 'Helvetica' }]} numberOfLines={1}>
                                    ID : {profile?.sabca_id || 'PENDING'} : {isLifeMember ? 'LIFE TIME' : (profile?.membership_type || 'GENERAL').toUpperCase()}
                                </Text>
                                <Text style={[styles.memberId, { color: '#0f4a8a', fontWeight: '400', fontSize: pt(8.5), fontFamily: 'Helvetica' }]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>
                                    {profile?.phone ? profile.phone.replace(/^(\+91[- ]?)/, '') : ''} : Blood Group : {profile?.blood_group || 'O+'}
                                </Text>
                            </View>

                            {/* Avatar Right */}
                            <View style={[styles.avatarArea, { paddingTop: 0, width: mm(13.5), height: mm(13.5), marginRight: mm(4) }]}>
                                <Image
                                    source={{ uri: profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?img=12' }}
                                    style={{ width: '100%', height: '100%', borderRadius: mm(13.5) / 2, borderWidth: mm(0.15), borderColor: '#175b8e', backgroundColor: '#E2E8F0' }}
                                    resizeMode="cover"
                                />
                            </View>
                        </View>

                        {/* Spacer */}
                        <View style={{ flex: 1 }} />

                        {/* Bottom Section - Company & QR */}
                        <View style={[styles.bottomSection, { paddingBottom: mm(3.5), paddingLeft: mm(4), paddingRight: mm(4), width: '100%', position: 'absolute', bottom: 0, zIndex: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }]}>
                            <View style={[styles.companyInfo, { paddingRight: mm(2), height: mm(11.7), flexDirection: 'column', justifyContent: 'flex-end', maxWidth: mm(58) }]}>
                                <Text style={[styles.companyName, { fontWeight: '700', letterSpacing: 0.5, fontSize: pt(9), marginBottom: mm(0.3), color: '#FFF', textTransform: 'uppercase', fontFamily: 'Helvetica' }]} numberOfLines={1}>
                                    {profile?.company_name || 'S R EDIFICE PVT LTD'}
                                </Text>
                                <Text style={[styles.companyAddress, { fontSize: pt(6), opacity: 0.95, lineHeight: pt(7), marginBottom: mm(0.2), color: '#FFF', fontWeight: '600', fontFamily: 'Helvetica' }]} numberOfLines={2}>
                                    {profile?.location || '# 6-120 / 504, Autumn Field Apartment, 3rd Road,\nChalasani Nagar, Kanuru, VIJAYAWADA - 520007'}
                                </Text>
                                <Text style={[styles.companyEmail, { fontSize: pt(6), opacity: 0.95, marginTop: 0, lineHeight: pt(7), color: '#FFF', fontWeight: '600', fontFamily: 'Helvetica' }]}>
                                    e-mail: {profile?.email || 'srcvjw@gmail.com, srcvjwd@gmail.com'}
                                </Text>
                            </View>

                            <View style={[styles.qrSection, { width: mm(11), height: mm(11.7), alignItems: 'flex-end', justifyContent: 'flex-end' }]}>
                                <View style={[styles.qrBg, { padding: mm(0.5), borderRadius: mm(0.5), width: mm(11), height: mm(11), justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }]}>
                                    <QRCode
                                        value={qrValue}
                                        size={mm(10)} // Slightly smaller than container for padding
                                        color="black"
                                        backgroundColor="white"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </ViewShot>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleDownload}>
                        <Download size={20} color="#FFF" />
                        <Text style={styles.actionText}>Download ID</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={handleShare}>
                        <Share2 size={20} color={Colors.light.primary} />
                        <Text style={[styles.actionText, styles.shareText]}>Share ID</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.noteBox}>
                    <Text style={styles.noteTitle}>Note:</Text>
                    <Text style={styles.noteText}>
                        This is a digital representation of your membership card. It can be used for event entry and availing partner discounts.
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        padding: 20,
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    cardContainer: {
        width: '100%',
        aspectRatio: 1.58, // Standard ID card ratio (e.g. 1011x638)
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 30,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    idCard: {
        width: '100%',
        height: '100%',
        // Remove padding to allow image to fill exactly
    },
    cardBackgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
    },
    topSection: {
        flexDirection: 'row',
        paddingTop: 15,
        paddingHorizontal: 15,
        height: '60%',
    },
    logoArea: {
        width: '20%',
        alignItems: 'center',
        paddingTop: 2,
    },
    placeholderLogo: {
        borderWidth: 1.5,
        borderColor: '#1E40AF', // Blue color to match branding
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    logoTextBlue: {
        color: '#1E40AF',
        fontWeight: '900',
        fontSize: 10,
        letterSpacing: 1,
    },
    detailsArea: {
        flex: 1,
        paddingLeft: 10,
        paddingTop: 5,
    },
    memberName: {
        color: '#1E40AF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    memberRole: {
        color: '#0F766E', // Teal color like in template
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        fontFamily: 'Helvetica',
    },
    memberId: {
        color: '#0369A1',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
        fontFamily: 'Helvetica',
    },
    memberPhone: {
        color: '#0369A1',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Helvetica',
    },
    avatarArea: {
        width: '25%',
        alignItems: 'flex-end',
        paddingTop: 5,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#1E40AF',
        backgroundColor: '#E2E8F0',
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 15,
        paddingBottom: 15,
        height: '35%',
    },
    companyInfo: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    companyName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
        fontFamily: 'Helvetica',
    },
    companyAddress: {
        color: '#FFF',
        fontSize: 11,
        marginBottom: 2,
        opacity: 0.9,
        fontFamily: 'Helvetica',
    },
    companyEmail: {
        color: '#FFF',
        fontSize: 11,
        opacity: 0.9,
        fontFamily: 'Helvetica',
    },
    qrSection: {
        marginLeft: 10,
    },
    qrBg: {
        backgroundColor: '#FFF',
        padding: 4,
        borderRadius: 4,
    },
    actions: {
        width: '100%',
        flexDirection: 'row',
        gap: 15,
        marginBottom: 30,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.light.primary,
        paddingVertical: 14,
        borderRadius: 12,
    },
    shareBtn: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    actionText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    shareText: {
        color: Colors.light.primary,
    },
    noteBox: {
        backgroundColor: '#E2E8F0',
        padding: 16,
        borderRadius: 12,
        width: '100%',
    },
    noteTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    },
});
