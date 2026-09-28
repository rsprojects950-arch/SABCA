import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, KeyboardAvoidingView, Platform, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { supabase } from '../../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

import { ArrowLeft, User, FileText, Calendar, Paperclip, Send, CheckCircle, AlertCircle, Clock, ShieldAlert, ChevronDown, ChevronUp, AlertTriangle, MapPin } from 'lucide-react-native';

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected', 'Escalated'];

import { useTheme } from '../../../ctx/ThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';

export default function AdminGrievanceDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { lightImpact, successFeedback, errorFeedback } = useHaptics();

    const [grievance, setGrievance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [remark, setRemark] = useState('');
    const [saving, setSaving] = useState(false);

    // New State
    const [timeline, setTimeline] = useState<any[]>([]);
    const [moderators, setModerators] = useState<any[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [showResolution, setShowResolution] = useState(false);

    useEffect(() => {
        if (id) {
            fetchDetails();
            fetchModerators();
        }
    }, [id]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            // Fetch Grievance
            const { data: gData, error: gError } = await supabase
                .from('grievances')
                .select(`
                    *,
                    profiles:profiles!grievances_user_id_fkey_profiles (full_name, email, phone, division),
                    assigned_to_user:assigned_to(full_name),
                    grievance_attachments (*)
                `)
                .eq('id', id)
                .single();

            if (gError) throw gError;
            setGrievance(gData);

            // Fetch Timeline
            const { data: tData, error: tError } = await supabase
                .from('grievance_timeline')
                .select('*')
                .eq('grievance_id', id)
                .order('date', { ascending: true });

            if (tData) setTimeline(tData);

        } catch (error: any) {
            console.error('Fetch error:', error);
            Alert.alert('Error', `Failed to load details: ${error.message}`);
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const fetchModerators = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, division')
            .eq('role', 'moderator');
        if (data) setModerators(data);
    };

    const updateGrievance = async (updates: any) => {
        setSaving(true);
        const { error } = await supabase
            .from('grievances')
            .update(updates)
            .eq('id', id);

        if (error) {
            errorFeedback();
            Alert.alert('Error', 'Failed to update grievance');
        } else {
            successFeedback();
            // If status changed, add to timeline
            if (updates.status) {
                await supabase.from('grievance_timeline').insert({
                    grievance_id: id,
                    status: updates.status,
                    remark: `Status updated to ${updates.status} by Admin`,
                    created_by: grievance.assigned_to, // Or current user if we had auth context here ideally
                    date: new Date().toISOString()
                });
            }

            setGrievance({ ...grievance, ...updates });
            if (Object.keys(updates).length === 1 && updates.status) {
                // specific alert for quick status change
            } else {
                Alert.alert('Success', 'Grievance updated successfully');
            }
            fetchDetails(); // Refresh timeline
        }
        setSaving(false);
    };

    const handleAssign = async (moderatorId: string) => {
        setAssigning(true);
        try {
            const { error } = await supabase
                .from('grievances')
                .update({ assigned_to: moderatorId })
                .eq('id', id);

            if (error) throw error;

            successFeedback();
            Alert.alert('Success', 'Grievance assigned successfully.');
            setShowAssignModal(false);
            fetchDetails();
        } catch (error: any) {
            errorFeedback();
            Alert.alert('Assignment Failed', error.message);
        } finally {
            setAssigning(false);
        }
    };

    const handleAddRemark = async () => {
        if (!remark.trim() || !grievance) return;

        // Add to timeline instead of just remarks field
        const { error } = await supabase.from('grievance_timeline').insert({
            grievance_id: id,
            status: grievance.status,
            remark: `Admin Note: ${remark}`,
            created_by: null, // System/Admin
            date: new Date().toISOString()
        });

        if (error) {
            errorFeedback();
            Alert.alert('Error', 'Failed to add remark');
        } else {
            successFeedback();
            setRemark('');
            fetchDetails();
        }
    };

    const toggleDocRequest = async () => {
        if (!grievance) return;
        await updateGrievance({ documents_requested: !grievance.documents_requested });
    };

    const toggleEscalation = async () => {
        if (!grievance) return;
        const isEscalated = !!grievance.escalated_at;

        lightImpact();
        Alert.alert(
            isEscalated ? 'Remove Escalation?' : 'Escalate Grievance?',
            isEscalated
                ? 'This will remove the escalation status. Are you sure?'
                : 'This will manually escalate the grievance immediately. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: isEscalated ? 'Remove' : 'Escalate',
                    style: isEscalated ? 'default' : 'destructive',
                    onPress: async () => {
                        await updateGrievance({
                            escalated_at: isEscalated ? null : new Date().toISOString(),
                            status: isEscalated ? 'In Progress' : 'Escalated'
                        });
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Submitted': return '#64748B';
            case 'Under Review': return '#3B82F6';
            case 'In Progress': return '#F59E0B';
            case 'Resolved': return '#10B981';
            case 'Rejected': return '#EF4444';
            case 'Escalated': return '#EF4444';
            default: return '#64748B';
        }
    };

    if (loading || !grievance) return <View style={styles.loading}><Text>Loading...</Text></View>;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Ticket #{grievance.display_id || grievance.id.slice(0, 8)}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Escalation Banner */}
                    {grievance.escalated_at && (
                        <LinearGradient
                            colors={['#7f1d1d', '#991b1b']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.escalationBanner}
                        >
                            <AlertTriangle size={20} color="#FECACA" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.escalationTitle}>Escalated to Administration</Text>
                                <Text style={styles.escalationTime}>
                                    Escalated on {new Date(grievance.escalated_at).toLocaleDateString()}
                                </Text>
                            </View>
                        </LinearGradient>
                    )}

                    {/* Resolution Summary */}
                    {grievance.status === 'Resolved' && (
                        <View style={[styles.resolutionContainer, { backgroundColor: colors.card, borderColor: '#10B981', marginBottom: 20 }]}>
                            <TouchableOpacity
                                style={[styles.resolutionHeader, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}
                                onPress={() => { lightImpact(); setShowResolution(!showResolution); }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <CheckCircle size={24} color="#10B981" />
                                    <Text style={[styles.resolutionTitle, { color: '#10B981' }]}>Resolution Summary</Text>
                                </View>
                                {showResolution ? <ChevronUp size={20} color={colors.icon} /> : <ChevronDown size={20} color={colors.icon} />}
                            </TouchableOpacity>

                            {showResolution && (
                                <View style={styles.resolutionContent}>
                                    <Text style={[styles.resolutionText, { color: colors.text }]}>
                                        {grievance.resolution_summary || "No detailed summary provided."}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Status & Priority Cards */}
                    <View style={styles.statusSection}>
                        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.label, { color: colors.icon }]}>Current Status</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                {STATUSES.map(s => {
                                    const color = getStatusColor(s);
                                    const isActive = grievance.status === s;
                                    return (
                                        <TouchableOpacity
                                            key={s}
                                            style={[
                                                styles.chip,
                                                {
                                                    backgroundColor: isActive ? color : colors.background,
                                                    borderColor: isActive ? color : colors.border
                                                }
                                            ]}
                                            onPress={() => { lightImpact(); updateGrievance({ status: s }); }}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                {
                                                    color: isActive ? '#FFF' : colors.text,
                                                    fontWeight: isActive ? '700' : '500'
                                                }
                                            ]}>{s}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.label, { color: colors.icon }]}>Priority Level</Text>
                            <View style={styles.priorityRow}>
                                {PRIORITIES.map(p => {
                                    const color = p === 'High' ? '#EF4444' : p === 'Medium' ? '#F59E0B' : '#10B981';
                                    const isActive = grievance.priority === p;
                                    return (
                                        <TouchableOpacity
                                            key={p}
                                            style={[
                                                styles.priorityBtn,
                                                { borderColor: isActive ? color : colors.border, backgroundColor: isActive ? color : colors.background }
                                            ]}
                                            onPress={() => { lightImpact(); updateGrievance({ priority: p }); }}
                                        >
                                            <Text style={[
                                                styles.priorityText,
                                                { color: isActive ? '#FFF' : colors.icon, fontWeight: isActive ? 'bold' : 'normal' }
                                            ]}>
                                                {p}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    {/* Admin Actions with Assignment */}
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Admin Actions</Text>

                        {/* Assign Moderator Button - Violet */}
                        <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: '#8B5CF6', marginBottom: 12, backgroundColor: '#8B5CF610' }]}
                            onPress={() => { lightImpact(); setShowAssignModal(true); }}
                        >
                            <User size={20} color="#8B5CF6" />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>
                                    {grievance.assigned_to_user ? `Assigned to: ${grievance.assigned_to_user.full_name}` : 'Assign Moderator'}
                                </Text>
                            </View>
                            <ChevronDown size={16} color="#8B5CF6" />
                        </TouchableOpacity>

                        {/* Request Documents - Blue */}
                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                { borderColor: '#3B82F6', backgroundColor: grievance?.documents_requested ? '#3B82F6' : '#3B82F610' }
                            ]}
                            onPress={() => { lightImpact(); toggleDocRequest(); }}
                        >
                            <FileText size={20} color={grievance?.documents_requested ? "#FFF" : "#3B82F6"} />
                            <Text style={[styles.actionBtnText, { color: grievance?.documents_requested ? '#FFF' : '#3B82F6' }]}>
                                {grievance?.documents_requested ? 'Documents Requested' : 'Request More Documents'}
                            </Text>
                        </TouchableOpacity>

                        {/* Escalate - Red/Green */}
                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                { marginTop: 12, borderColor: grievance?.escalated_at ? '#10B981' : '#EF4444', backgroundColor: grievance?.escalated_at ? '#10B98115' : '#EF444415' }
                            ]}
                            onPress={toggleEscalation}
                        >
                            <ShieldAlert size={20} color={grievance?.escalated_at ? '#10B981' : '#EF4444'} />
                            <Text style={[styles.actionBtnText, { color: grievance?.escalated_at ? '#10B981' : '#EF4444' }]}>
                                {grievance?.escalated_at ? 'Escalated (Tap to Remove)' : 'Escalate Manually'}
                            </Text>
                        </TouchableOpacity>

                        <Text style={[styles.label, { marginTop: 16, color: colors.icon }]}>Add Internal Note / Remark</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                placeholder="Add a remark..."
                                value={remark}
                                onChangeText={setRemark}
                                placeholderTextColor={colors.icon}
                            />
                            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleAddRemark}>
                                <Send size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Details Card */}
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{grievance.title}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <User size={14} color={colors.icon} />
                                <Text style={[styles.metaText, { color: colors.icon }]}>{grievance.profiles?.full_name || 'Unknown User'}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={[styles.metaText, { color: '#BAE6FD', fontWeight: '600' }]}>[{grievance.profiles?.division || 'General'}]</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Calendar size={14} color={colors.icon} />
                                <Text style={[styles.metaText, { color: colors.icon }]}>{new Date(grievance.submitted_date).toLocaleDateString()}</Text>
                            </View>
                        </View>

                        <Text style={[styles.descTitle, { color: colors.text }]}>Description</Text>
                        <Text style={[styles.description, { color: colors.text }]}>{grievance.description}</Text>

                        {/* Attachments */}
                        {grievance.grievance_attachments && grievance.grievance_attachments.length > 0 && (
                            <View style={[styles.attachmentSection, { borderTopColor: colors.border }]}>
                                <Text style={[styles.label, { color: colors.icon }]}>Attachments</Text>
                                {grievance.grievance_attachments.map((file: any) => (
                                    <TouchableOpacity
                                        key={file.id}
                                        style={[styles.fileCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                                        onPress={() => Linking.openURL(file.file_url)}
                                    >
                                        <Paperclip size={20} color={colors.primary} />
                                        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{file.file_name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Status Timeline */}
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16, marginLeft: 4 }]}>Status Timeline</Text>
                    <View style={[styles.timelineContainer, { backgroundColor: colors.card }]}>
                        {timeline.map((event: any, index: number) => (
                            <View key={event.id} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    {/* Continuous Line */}
                                    {index !== timeline.length - 1 && (
                                        <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                                    )}
                                    {/* Dot */}
                                    <View style={[styles.timelineDot, { backgroundColor: getStatusColor(event.status), borderColor: colors.card }]} />
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={[styles.timelineStatus, { color: colors.text }]}>{event.status}</Text>
                                    <Text style={[styles.timelineDate, { color: colors.icon }]}>
                                        {new Date(event.date).toLocaleString()}
                                    </Text>
                                    {event.remark && (
                                        <View style={[styles.remarkBubble, { backgroundColor: colors.background }]}>
                                            <Text style={[styles.timelineRemark, { color: colors.text }]}>{event.remark}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Assignment Modal */}
            <Modal
                visible={showAssignModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => { lightImpact(); setShowAssignModal(false); }}
            >
                <View style={[styles.modalOverlay, { justifyContent: 'center', padding: 20 }]}>
                    <View style={[styles.modalContent, { borderRadius: 24, minHeight: 0, backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Assign Moderator</Text>
                            <TouchableOpacity onPress={() => { lightImpact(); setShowAssignModal(false); }} style={styles.closeModalBtn}>
                                <Text style={{ color: colors.icon, fontSize: 16, fontWeight: '600' }}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={{ marginBottom: 20, color: colors.icon, lineHeight: 20 }}>
                            Select a moderator to handle this grievance. They will receive a notification.
                        </Text>

                        <ScrollView style={{ maxHeight: 300 }}>
                            {moderators.length === 0 ? (
                                <Text style={{ textAlign: 'center', padding: 20, color: colors.icon }}>No moderators found.</Text>
                            ) : (
                                moderators.map(mod => (
                                    <TouchableOpacity
                                        key={mod.id}
                                        style={[styles.moderatorItem, { borderBottomColor: colors.border }]}
                                        onPress={() => { lightImpact(); handleAssign(mod.id); }}
                                    >
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                            <Text style={styles.avatarText}>{mod.full_name.charAt(0)}</Text>
                                        </View>
                                        <View style={{ flex: 1, paddingRight: 10 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }} numberOfLines={2}>{mod.full_name}</Text>
                                            <Text style={{ fontSize: 13, color: colors.icon }} numberOfLines={1}>{mod.division || 'General'}</Text>
                                        </View>
                                        {grievance.assigned_to === mod.id && (
                                            <CheckCircle size={24} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>

                        {assigning && (
                            <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
    backButton: { padding: 8, marginLeft: -8 },
    content: { padding: 20, paddingBottom: 40 },

    // Status Section
    statusSection: { marginBottom: 24 },
    statusCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    label: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    chipScroll: { flexDirection: 'row' },
    chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, backgroundColor: '#F1F5F9', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    chipText: { fontSize: 14, color: '#64748B', fontWeight: '500' },

    // Priority
    priorityRow: { flexDirection: 'row', gap: 12 },
    priorityBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
    activePriorityBtn: { borderWidth: 2 },
    priorityText: { fontSize: 14, color: '#64748B', fontWeight: '600' },

    // Cards
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: 20 },

    // Action Buttons
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.light.primary, gap: 12 },
    actionBtnText: { color: Colors.light.primary, fontWeight: '700', fontSize: 15 },

    // Remarks Input
    inputRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 20, height: 52, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15 },
    sendBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },

    // Details
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.light.text, marginBottom: 16 },
    metaRow: { flexDirection: 'row', gap: 24, marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
    descTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10, textTransform: 'uppercase' },
    description: { fontSize: 16, color: '#334155', lineHeight: 26 },

    // Attachments
    attachmentSection: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, gap: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
    fileName: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.light.text },

    // Timeline
    timelineContainer: { borderRadius: 24, padding: 24, marginBottom: 40 },
    timelineItem: { flexDirection: 'row', marginBottom: 0, minHeight: 80 },
    timelineLeft: { alignItems: 'center', width: 30, marginRight: 16 },
    timelineLine: { position: 'absolute', top: 12, bottom: -12, width: 2, backgroundColor: '#E2E8F0', left: 14 },
    timelineDot: { width: 14, height: 14, borderRadius: 7, zIndex: 2, borderWidth: 2, borderColor: '#FFF', marginTop: 6 },
    timelineContent: { flex: 1, paddingBottom: 30 },
    timelineStatus: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    timelineDate: { fontSize: 13, color: '#94A3B8', marginBottom: 8 },
    remarkBubble: { padding: 12, borderRadius: 12, backgroundColor: '#F1F5F9', borderTopLeftRadius: 2, marginTop: 4 },
    timelineRemark: { fontSize: 14, color: '#475569', lineHeight: 20 },

    // Escalation Banner
    escalationBanner: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 24, gap: 16, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    escalationTitle: { color: '#FECACA', fontWeight: 'bold', fontSize: 17 },
    escalationTime: { color: '#FECACA', fontSize: 13, opacity: 0.9, marginTop: 2 },

    // Resolution Summary
    resolutionContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    resolutionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    resolutionTitle: { fontWeight: 'bold', fontSize: 16 },
    resolutionContent: { padding: 20, backgroundColor: 'transparent' },
    resolutionText: { fontSize: 15, lineHeight: 24 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 18, 20, 0.6)' },
    modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: 'bold' },
    closeModalBtn: { padding: 4 },
    moderatorItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, gap: 16 },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
