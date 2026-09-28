import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Share, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, MapPin, Clock, Share2, CheckCircle, Users } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../ctx/AuthContext';
import { useTheme } from '../../ctx/ThemeContext';

export default function EventDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user, isMembershipActive } = useAuth();
    const { colors, isDark } = useTheme();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);

    // User Profile State
    const [registrantName, setRegistrantName] = useState('');
    const [registrantEmail, setRegistrantEmail] = useState('');
    const [registrantPhone, setRegistrantPhone] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        if (id) {
            fetchEventDetails();
            checkRegistrationStatus();
        }
    }, [id, user]);

    useEffect(() => {
        if (user) fetchUserProfile();
    }, [user]);

    const fetchEventDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (data) {
                setEvent(data);
            } else {

                Alert.alert('Error', 'Event not found or access denied.');
                router.back();
            }

            if (error) console.error('Error fetching event:', error);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const checkRegistrationStatus = async () => {
        if (!user || !id) return;
        try {
            const { data } = await supabase
                .from('event_registrations')
                .select('*')
                .eq('event_id', id)
                .eq('user_id', user.id)
                .single();

            if (data) setIsRegistered(true);
        } catch (e) {
            // Not registered or error
        }
    };

    const fetchUserProfile = async () => {
        if (!user) return;
        setRegistrantEmail(user.email || '');
        try {
            const { data } = await supabase
                .from('profiles')
                .select('full_name, phone')
                .eq('id', user.id)
                .single();

            if (data) {
                setRegistrantName(data.full_name || '');
                setRegistrantPhone(data.phone || '');
            }
        } catch (e) {
            console.error('Error fetching profile:', e);
        }
    };

    const handleRegister = () => {
        if (isRegistered) return;
        setShowModal(true);
    };

    const confirmRegistration = async () => {
        if (!user || !event) return;
        setRegistering(true);
        try {
            const { error } = await supabase
                .from('event_registrations')
                .insert({
                    event_id: event.id,
                    user_id: user.id
                });

            if (error) throw error;

            setIsRegistered(true);

            // Update event attendee count locally
            setEvent((prev: any) => ({
                ...prev,
                attendees: (prev?.attendees || 0) + 1
            }));

        } catch (error: any) {
            Alert.alert('Registration Failed', error.message);
        } finally {
            setRegistering(false);
        }
    };

    const handleDeregister = async () => {
        if (!user) return; // Fix: Ensure user exists before proceeding
        Alert.alert(
            'De-register',
            'Are you sure you want to cancel your registration?',
            [
                { text: 'No, Keep it', style: 'cancel' },
                {
                    text: 'Yes, De-register',
                    style: 'destructive',
                    onPress: async () => {
                        setRegistering(true); // Re-use registering state for loading
                        try {
                            const { error } = await supabase
                                .from('event_registrations')
                                .delete()
                                .eq('event_id', id)
                                .eq('user_id', user.id);

                            if (error) throw error;

                            setIsRegistered(false);
                            setEvent((prev: any) => ({
                                ...prev,
                                attendees: Math.max(0, (prev?.attendees || 1) - 1)
                            }));
                            Alert.alert('Success', 'You have been de-registered from this event.');
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to de-register: ' + error.message);
                        } finally {
                            setRegistering(false);
                        }
                    }
                }
            ]
        );
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this event: ${event?.title} at ${event?.location}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (loading || !event) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.center}>
                    <Text style={{ color: colors.text }}>Loading Event...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: event.image_url }} style={styles.image} resizeMode="cover" />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.imageOverlay}
                    />
                    <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.shareButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={handleShare}>
                        <Share2 size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Content Body */}
                <View style={[styles.content, { backgroundColor: colors.background }]}>
                    <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

                    {/* Meta Info Grid */}
                    <View style={styles.metaGrid}>
                        <View style={styles.metaItem}>
                            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(229, 57, 53, 0.1)' : '#EFF6FF' }]}>
                                <Calendar size={20} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.metaLabel, { color: colors.icon }]}>Date</Text>
                                <Text style={[styles.metaValue, { color: colors.text }]}>{event.date?.split('•')[0].trim()}</Text>
                            </View>
                        </View>
                        <View style={styles.metaItem}>
                            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(202, 138, 4, 0.1)' : '#FEF9C3' }]}>
                                <Clock size={20} color="#CA8A04" />
                            </View>
                            <View>
                                <Text style={[styles.metaLabel, { color: colors.icon }]}>Time</Text>
                                <Text style={[styles.metaValue, { color: colors.text }]}>{event.date?.split('•')[1] || '10:00 AM'}</Text>
                            </View>
                        </View>
                        <View style={styles.metaItem}>
                            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(22, 101, 52, 0.1)' : '#DCFCE7' }]}>
                                <Users size={20} color="#166534" />
                            </View>
                            <View>
                                <Text style={[styles.metaLabel, { color: colors.icon }]}>Attendees</Text>
                                <Text style={[styles.metaValue, { color: colors.text }]}>{event.attendees}+ Registered</Text>
                            </View>
                        </View>
                        <View style={styles.metaItem}>
                            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(148, 163, 184, 0.1)' : '#F1F5F9' }]}>
                                <MapPin size={20} color={isDark ? colors.icon : '#475569'} />
                            </View>
                            <View>
                                <Text style={[styles.metaLabel, { color: colors.icon }]}>Location</Text>
                                <Text style={[styles.metaValue, { color: colors.text }]}>{event.location}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>About Event</Text>
                    <Text style={[styles.description, { color: colors.text }]}>{event.description}</Text>
                    <Text style={[styles.description, { color: colors.text }]}>
                        Join us for this comprehensive session where industry leaders will share insights on the future of construction in Andhra Pradesh.
                        Network with peers, gain knowledge, and enhance your professional skills.
                    </Text>

                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[
                        styles.registerBtn,
                        { backgroundColor: colors.primary, shadowColor: colors.primary },
                        isRegistered && [styles.registeredBtn, { backgroundColor: '#10B981', shadowColor: '#10B981' }],
                        (!isRegistered && !isMembershipActive) && { backgroundColor: isDark ? 'rgba(71, 85, 105, 0.2)' : '#F1F5F9', shadowColor: 'transparent', elevation: 0 }
                    ]}
                    onPress={isRegistered ? handleDeregister : handleRegister}
                    disabled={!isRegistered && !isMembershipActive}
                >
                    {isRegistered ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <CheckCircle size={20} color="#FFF" />
                            <Text style={styles.registerBtnText}>Registered (Tap to Cancel)</Text>
                        </View>
                    ) : (
                        <Text style={[styles.registerBtnText, (!isRegistered && !isMembershipActive) && { color: colors.icon }]}>
                            {isMembershipActive ? 'Register Now' : 'Paid Members Only'}
                        </Text>
                    )}
                </TouchableOpacity>
            </SafeAreaView>
            {/* Registration Modal */}
            <Modal
                visible={showModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        {!isRegistered ? (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Registration</Text>
                                    <TouchableOpacity onPress={() => setShowModal(false)}>
                                        <ArrowLeft size={24} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.modalSubtitle, { color: colors.icon }]}>You are registering for:</Text>
                                <Text style={[styles.eventName, { color: colors.primary }]}>{event.title}</Text>

                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: colors.icon }]}>Name</Text>
                                    <View style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                        <Text style={[styles.value, { color: colors.text }]}>{registrantName || 'N/A'}</Text>
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: colors.icon }]}>Email</Text>
                                    <View style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                        <Text style={[styles.value, { color: colors.text }]}>{registrantEmail || 'N/A'}</Text>
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: colors.icon }]}>Phone</Text>
                                    <View style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                        <Text style={[styles.value, { color: colors.text }]}>{registrantPhone || 'N/A'}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                                    onPress={confirmRegistration}
                                    disabled={registering}
                                >
                                    <Text style={styles.confirmBtnText}>{registering ? 'Registering...' : 'Confirm & Register'}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.successView}>
                                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
                                    <CheckCircle size={48} color="#10B981" />
                                </View>
                                <Text style={[styles.successTitle, { color: '#10B981' }]}>Registration Successful!</Text>
                                <Text style={[styles.successDesc, { color: colors.icon }]}>
                                    You have successfully registered for {event.title}.
                                    A confirmation email with ticket details has been sent to your registered email.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.closeBtn, { backgroundColor: colors.background }]}
                                    onPress={() => {
                                        setShowModal(false);
                                    }}
                                >
                                    <Text style={[styles.closeBtnText, { color: colors.text }]}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    imageContainer: {
        height: 300,
        width: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        marginTop: -30,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        minHeight: 500,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 24,
    },
    metaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    metaItem: {
        width: '47%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    metaLabel: {
        fontSize: 12,
        color: '#64748B',
    },
    metaValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
        marginBottom: 16,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    registerBtn: {
        backgroundColor: Colors.light.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    registeredBtn: {
        backgroundColor: '#10B981',
        shadowColor: '#10B981',
    },
    registerBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 450,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 4,
    },
    eventName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.primary,
        marginBottom: 24,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F8FAFC',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    value: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    confirmBtn: {
        backgroundColor: Colors.light.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    confirmBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    successView: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 12,
    },
    successDesc: {
        textAlign: 'center',
        color: '#64748B',
        lineHeight: 24,
        marginBottom: 32,
    },
    closeBtn: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    closeBtnText: {
        color: '#475569',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
