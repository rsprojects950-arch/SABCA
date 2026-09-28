import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Linking, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, FileText, Send, Paperclip, X, Download, Edit2, Save, ChevronUp, ChevronDown, AlertTriangle, User as UserIcon, Plus } from 'lucide-react-native';
import { PrimaryButton, SecondaryButton } from '../../../components/ui';
import { supabase } from '../../../lib/supabase';

import { useAuth } from '../../../ctx/AuthContext';
import { useTheme } from '../../../ctx/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export default function GrievanceDetailsScreen() {
    const { id } = useLocalSearchParams();
    // const router = useRouter(); // Removed because router is now imported directly
    const { user, isAdmin, isLoading: authLoading } = useAuth(); // Add isAdmin
    const { colors, isDark } = useTheme();

    const [grievance, setGrievance] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showResolution, setShowResolution] = useState(false);

    // Assignment State
    const [moderators, setModerators] = useState<any[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [assignedModerator, setAssignedModerator] = useState<any>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [attachment, setAttachment] = useState<any>(null);
    const [sending, setSending] = useState(false);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!authLoading && user && id) {
            fetchDetails();
            if (isAdmin) fetchModerators();
        }
    }, [id, isAdmin, user, authLoading]);

    const fetchModerators = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, division')
            .eq('role', 'moderator');
        if (data) setModerators(data);
    };

    const handleAssign = async (moderatorId: string) => {
        setAssigning(true);
        try {
            const { error } = await supabase
                .from('grievances')
                .update({ assigned_to: moderatorId })
                .eq('id', id);

            if (error) throw error;

            if (error) throw error;

            if (error) throw error;

            Alert.alert('Success', 'Grievance assigned successfully.');
            setShowAssignModal(false);
            fetchDetails(); // Refresh to show new assignment
        } catch (error: any) {
            Alert.alert('Assignment Failed', error.message);
        } finally {
            setAssigning(false);
        }
    };

    const fetchDetails = async () => {
        setLoading(true);
        try {
            // 1. Fetch Grievance with Assigned User details
            const { data: gData, error: gError } = await supabase
                .from('grievances')
                .select('*, assigned_to_user:assigned_to(full_name)')
                .eq('id', id)
                .single();

            if (gError) throw gError;
            setGrievance(gData);
            if (gData.assigned_to_user) {
                setAssignedModerator(gData.assigned_to_user);
            } else {
                setAssignedModerator(null);
            }

            // 2. Fetch Timeline
            const { data: tData, error: tError } = await supabase
                .from('grievance_timeline')
                .select('*')
                .eq('grievance_id', id)
                .order('date', { ascending: true }); // Oldest first for timeline view (top to bottom)

            if (tData) setTimeline(tData);

            // 3. Fetch Attachments
            const { data: aData, error: aError } = await supabase
                .from('grievance_attachments')
                .select('*')
                .eq('grievance_id', id)
                .order('uploaded_at', { ascending: false });

            if (aData) setAttachments(aData);

        } catch (error) {
            // Only show alert if user is logged in
            if (user) {
                Alert.alert('Error', 'Could not load grievance details.');
            }
        } finally {
            setLoading(false);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
                multiple: false
            });

            if (result.canceled) return;

            const file = result.assets[0];
            if (file.size && file.size > 5 * 1024 * 1024) {
                Alert.alert('File too large', 'The file size is larger than 5MB. Please compress it and try again.');
                return;
            }
            setAttachment(file);

        } catch (error) {

        }
    };

    const handleSend = async () => {
        if (!replyText.trim() && !attachment) {
            Alert.alert('Error', 'Please enter a message or attach a file.');
            return;
        }

        setSending(true);
        try {
            // Upload attachment if exists
            let uploadedFileUrl = null;
            if (attachment) {
                const fileExt = attachment.name.split('.').pop();
                const fileName = `${id}/${Date.now()}.${fileExt}`;
                const fileBase64 = await FileSystem.readAsStringAsync(attachment.uri, { encoding: 'base64' });

                const { error: uploadError } = await supabase.storage
                    .from('grievance-attachments')
                    .upload(fileName, decode(fileBase64), { contentType: attachment.mimeType });

                if (uploadError) throw uploadError;

                uploadedFileUrl = supabase.storage.from('grievance-attachments').getPublicUrl(fileName).data.publicUrl;

                // Insert into attachments
                await supabase.from('grievance_attachments').insert({
                    grievance_id: id,
                    file_name: attachment.name,
                    file_url: uploadedFileUrl,
                    file_type: attachment.mimeType,
                    file_size_bytes: attachment.size
                });
            }

            // Insert into Timeline
            // If text is provided, add it as a remark (or if only file, say "File uploaded")
            const remarkText = replyText.trim() || (attachment ? `Uploaded file: ${attachment.name}` : 'Update');

            const { error: timelineError } = await supabase.from('grievance_timeline').insert({
                grievance_id: id,
                status: grievance.status, // Keep current status
                remark: remarkText,
                created_by: user?.id,
                date: new Date().toISOString()
            });

            if (timelineError) throw timelineError;

            // Success
            setReplyText('');
            setAttachment(null);
            setShowModal(false);
            fetchDetails(); // Refresh view

        } catch (error: any) {
            Alert.alert('Failed', error.message);
        } finally {
            setSending(false);
        }
    };

    const handleUpdateGrievance = async () => {
        if (!editTitle.trim() || !editDescription.trim()) {
            Alert.alert('Error', 'Title and description cannot be empty.');
            return;
        }
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('grievances')
                .update({
                    title: editTitle.trim(),
                    description: editDescription.trim(),
                    // updated_at handled by DB trigger
                })
                .eq('id', id);

            if (error) throw error;

            setShowEditModal(false);
            fetchDetails();
            Alert.alert('Success', 'Grievance updated successfully.');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Submitted': return '#64748B';
            case 'Under Review': return '#3B82F6';
            case 'In Progress': return '#F59E0B';
            case 'Resolved': return '#10B981';
            case 'Escalated': return '#EF4444';
            default: return '#64748B';
        }
    };

    const openDocument = (url: string) => {
        Linking.openURL(url);
    };

    const isOverdue = (dateString: string, status: string) => {
        if (status === 'Resolved' || status === 'Rejected') return false;
        const submitDate = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - submitDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 30;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!grievance) {
        return (
            <View style={styles.center}>
                <Text>Grievance not found.</Text>
            </View>
        );
    }

    const isEscalated = grievance.status === 'Escalated' || isOverdue(grievance.submitted_date, grievance.status);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Custom Gradient Header */}
            <LinearGradient
                colors={isDark ? ['#1e293b', '#0f172a'] : ['#E53935', '#8E44AD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.safeHeader}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/services')} style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <ArrowLeft size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: '#FFF' }]}>Grievance Details</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setEditTitle(grievance?.title || '');
                                setEditDescription(grievance?.description || '');
                                setShowEditModal(true);
                            }}
                            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                        >
                            <Edit2 size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Header Card */}
                <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                    <View style={styles.headerRow}>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(grievance.status)}${isDark ? '25' : '20'}` }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(grievance.status) }]}>
                                    {grievance.status}
                                </Text>
                            </View>
                            {isEscalated && (
                                <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(254, 202, 202, 0.2)' : '#FECACA' }]}>
                                    <Text style={[styles.statusText, { color: '#EF4444' }]}>
                                        {grievance.status === 'Escalated' ? 'Escalated' : 'Overdue'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.dateText, { color: colors.icon }]}>
                            {new Date(grievance.submitted_date).toLocaleDateString()}
                        </Text>
                    </View>

                    {grievance.documents_requested && (
                        <View style={[styles.actionRequiredBox, { backgroundColor: isDark ? 'rgba(255, 251, 235, 0.1)' : '#FFFBEB', borderColor: isDark ? 'rgba(252, 211, 77, 0.4)' : '#FCD34D' }]}>
                            <AlertCircle size={20} color="#B45309" />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionRequiredTitle, { color: isDark ? '#F59E0B' : '#B45309' }]}>Action Required</Text>
                                <Text style={[styles.actionRequiredText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                                    Admin has requested additional documents. Please upload them using the "Add Note / Upload File" button below.
                                </Text>
                            </View>
                        </View>
                    )}

                    <Text style={[styles.title, { color: colors.text }]}>{grievance.title}</Text>
                    <Text style={[styles.idText, { color: colors.icon }]}>ID: {grievance.display_id}</Text>

                    {/* Admin Assignment Section */}
                    {isAdmin && (
                        <TouchableOpacity
                            style={[styles.assignBanner, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : '#EEF2FF', borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE' }]}
                            onPress={() => setShowAssignModal(true)}
                        >
                            <UserIcon size={20} color={isDark ? '#818CF8' : '#4F46E5'} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.assignLabel, { color: isDark ? '#818CF8' : '#4F46E5' }]}>Assigned Moderator</Text>
                                <Text style={[styles.assignValue, { color: isDark ? '#C7D2FE' : '#312E81' }]}>
                                    {assignedModerator ? assignedModerator.full_name : 'Unassigned (Tap to assign)'}
                                </Text>
                            </View>
                            <ChevronDown size={20} color={isDark ? '#818CF8' : '#4F46E5'} />
                        </TouchableOpacity>
                    )}

                    <View style={[styles.metaBox, { backgroundColor: colors.background }]}>
                        <View style={styles.metaItem}>
                            <Text style={[styles.metaLabel, { color: colors.icon }]}>Last Updated</Text>
                            <Text style={[styles.metaValue, { color: colors.text }]}>
                                {new Date(grievance.updated_at).toLocaleDateString()}
                            </Text>
                            {/* 1. Escalation Status Banner */}
                            {grievance.is_escalated && (
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
                                            {grievance.escalated_at
                                                ? `Escalated on ${new Date(grievance.escalated_at).toLocaleDateString()} at ${new Date(grievance.escalated_at).toLocaleTimeString()}`
                                                : 'Priority has been raised to High.'}
                                        </Text>
                                    </View>
                                </LinearGradient>
                            )}

                            {/* 2. Resolution Summary (Collapsible) */}
                            {grievance.status === 'Resolved' && (
                                <View style={[styles.resolutionContainer, { backgroundColor: colors.card, borderColor: '#10B981' }]}>
                                    <TouchableOpacity
                                        style={[styles.resolutionHeader, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}
                                        onPress={() => setShowResolution(!showResolution)}
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
                                                {grievance.resolution_summary || "This grievance has been marked as resolved. No detailed summary was provided."}
                                            </Text>
                                            <View style={[styles.resolutionFooter, { borderTopColor: colors.border }]}>
                                                <Text style={[styles.resolutionDate, { color: colors.icon }]}>Resolved on {new Date(grievance.updated_at).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}


                        </View>



                        <View style={[styles.detailsGrid, { borderTopColor: colors.border }]}>
                            <View>
                                <Text style={[styles.metaLabel, { color: colors.icon }]}>Department</Text>
                                <Text style={[styles.metaValue, { color: colors.text }]}>{grievance.department || 'N/A'}</Text>
                            </View>
                            <View>
                                <Text style={[styles.metaLabel, { color: colors.icon }]}>Project Ref</Text>
                                <Text style={[styles.metaValue, { color: colors.text }]}>{grievance.project_ref || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.description, { color: colors.text }]}>{grievance.description}</Text>

                    {/* Timeline */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Status Timeline</Text>
                    <View style={[styles.timelineContainer, { backgroundColor: colors.card }]}>
                        {timeline.map((event: any, index: number) => (
                            <View key={event.id} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    <View style={[styles.dot, { backgroundColor: getStatusColor(event.status) }]} />
                                    {index !== timeline.length - 1 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={[styles.timelineDate, { color: colors.icon }]}>
                                        {new Date(event.date).toLocaleString()}
                                    </Text>
                                    <Text style={[styles.timelineStatus, { color: colors.text }]}>{event.status}</Text>
                                    {event.remark && (
                                        <Text style={[styles.timelineRemark, { color: colors.icon }]}>{event.remark}</Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Documents */}
                    <View style={styles.docsSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Attached Documents</Text>
                        {attachments.length === 0 ? (
                            <Text style={[styles.noDocsText, { color: colors.icon }]}>No documents attached.</Text>
                        ) : (
                            attachments.map((doc) => (
                                <TouchableOpacity
                                    key={doc.id}
                                    style={[styles.docRow, { backgroundColor: colors.card }]}
                                    onPress={() => openDocument(doc.file_url)}
                                >
                                    <View style={[styles.docIcon, { backgroundColor: colors.background }]}>
                                        <FileText size={20} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>{doc.file_name}</Text>
                                        <Text style={[styles.docSize, { color: colors.icon }]}>
                                            {(doc.file_size_bytes / 1024).toFixed(1)} KB
                                        </Text>
                                    </View>
                                    <Download size={20} color={colors.icon} />
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                </View>
            </ScrollView>

            {/* Footer Action */}
            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <PrimaryButton
                    title="Add Note / Upload File"
                    onPress={() => setShowModal(true)}
                    icon={<Plus size={20} color="#FFF" />}
                />
            </View>

            {/* Response Modal */}
            <Modal
                visible={showModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Update</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <X size={24} color={colors.icon} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="Type your remark here..."
                            placeholderTextColor={colors.icon}
                            multiline
                            numberOfLines={4}
                            value={replyText}
                            onChangeText={setReplyText}
                            textAlignVertical="top"
                        />

                        {attachment && (
                            <View style={[styles.attachmentChip, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}>
                                <Text style={[styles.attachmentChipText, { color: isDark ? '#34D399' : '#065F46' }]} numberOfLines={1}>
                                    {attachment.name}
                                </Text>
                                <TouchableOpacity onPress={() => setAttachment(null)}>
                                    <X size={16} color={isDark ? '#34D399' : '#065F46'} />
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.attachBtn, { backgroundColor: colors.background }]} onPress={pickDocument}>
                                <Paperclip size={20} color={colors.primary} />
                                <Text style={[styles.attachText, { color: colors.primary }]}>
                                    {attachment ? 'Change File' : 'Attach File'}
                                </Text>
                            </TouchableOpacity>
                            <PrimaryButton
                                title="Submit"
                                onPress={handleSend}
                                loading={sending}
                                icon={<Send size={18} color="#FFF" />}
                                style={{ flex: 1, marginLeft: 12 }}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Edit Modal */}
            <Modal
                visible={showEditModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowEditModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Grievance</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <X size={24} color={colors.icon} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.label, { color: colors.text }]}>Title</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 50, marginBottom: 12, backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            value={editTitle}
                            onChangeText={setEditTitle}
                            placeholderTextColor={colors.icon}
                        />

                        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                        <TextInput
                            style={[styles.input, { height: 120, backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            multiline
                            textAlignVertical="top"
                            value={editDescription}
                            onChangeText={setEditDescription}
                            placeholderTextColor={colors.icon}
                        />

                        <PrimaryButton
                            title="Save Changes"
                            onPress={handleUpdateGrievance}
                            loading={updating}
                            icon={<Save size={20} color="#FFF" />}
                            style={{ width: '100%', marginTop: 12 }}
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Assignment Modal */}
            <Modal
                visible={showAssignModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAssignModal(false)}
            >
                <View style={[styles.modalOverlay, { justifyContent: 'center', padding: 20 }]}>
                    <View style={[styles.modalContent, { borderRadius: 24, minHeight: 0, backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Assign Moderator</Text>
                            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                                <X size={24} color={colors.icon} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ marginBottom: 16, color: colors.icon }}>
                            Select a moderator to handle this grievance. They will receive a notification.
                        </Text>

                        <ScrollView style={{ maxHeight: 400, marginTop: 10 }}>
                            {moderators.length === 0 ? (
                                <Text style={{ textAlign: 'center', padding: 20, color: colors.icon }}>No moderators found.</Text>
                            ) : (
                                moderators.map(mod => (
                                    <TouchableOpacity
                                        key={mod.id}
                                        style={{
                                            padding: 16,
                                            borderBottomWidth: 1,
                                            borderBottomColor: colors.border,
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                        onPress={() => handleAssign(mod.id)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>{mod.full_name.charAt(0)}</Text>
                                            </View>
                                            <View style={{ flex: 1, paddingRight: 10 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }} numberOfLines={2}>{mod.full_name}</Text>
                                                <Text style={{ fontSize: 13, color: colors.icon }} numberOfLines={1}>{mod.division || 'No Division'}</Text>
                                            </View>
                                        </View>
                                        {grievance.assigned_to === mod.id && (
                                            <CheckCircle size={24} color={colors.success || '#10B981'} />
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 10,
    },
    safeHeader: {
        backgroundColor: 'transparent',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scroll: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: Colors.light.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 13,
        color: '#94A3B8',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 4,
    },
    idText: {
        fontSize: 13,
        color: Colors.light.icon,
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    metaBox: {
        flexDirection: 'column',
        backgroundColor: Colors.light.background,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 24,
    },
    metaItem: {
        gap: 4,
    },
    metaLabel: {
        fontSize: 11,
        color: Colors.light.icon,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    metaValue: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    description: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
        marginBottom: 20,
    },
    detailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        paddingTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 16,
    },
    timelineContainer: {
        backgroundColor: Colors.light.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    timelineLeft: {
        alignItems: 'center',
        width: 24,
        marginRight: 12,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 4,
        zIndex: 2,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: Colors.light.border,
        minHeight: 40,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 24,
    },
    timelineDate: {
        fontSize: 12,
        color: Colors.light.icon,
        marginBottom: 2,
    },
    timelineStatus: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        color: Colors.light.icon,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: Colors.light.text,
        lineHeight: 24,
    },
    escalationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginTop: 20,
        borderRadius: 12,
        gap: 12,
        marginBottom: 4,
    },
    escalationTitle: {
        color: '#FECACA',
        fontWeight: 'bold',
        fontSize: 14,
    },
    escalationTime: {
        color: '#FECACA',
        fontSize: 12,
        marginTop: 2,
    },
    resolutionContainer: {
        marginTop: 16,
        backgroundColor: Colors.light.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    resolutionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ECFDF5',
    },
    resolutionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#065F46',
    },
    resolutionContent: {
        padding: 16,
    },
    resolutionText: {
        fontSize: 15,
        color: '#1F2937',
        lineHeight: 22,
    },
    resolutionFooter: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 8,
    },
    resolutionDate: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
        textAlign: 'right',
    },
    docsSection: {
        marginBottom: 20,
    },
    noDocsText: {
        color: Colors.light.icon,
        fontStyle: 'italic',
    },
    docRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.card,
        padding: 12,
        borderRadius: 12,
        gap: 12,
        marginBottom: 8,
    },
    docIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    docName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.text,
    },
    docSize: {
        fontSize: 12,
        color: Colors.light.icon,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.light.card,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.light.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        minHeight: 300,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    input: {
        backgroundColor: Colors.light.background,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.light.border,
        minHeight: 120,
        fontSize: 16,
        marginBottom: 20,
    },
    attachmentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 20,
        gap: 8,
    },
    attachmentChipText: {
        color: '#065F46',
        fontSize: 13,
        maxWidth: 200,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionRequiredBox: {
        flexDirection: 'row',
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FCD34D',
        marginBottom: 16,
        gap: 12,
    },
    actionRequiredTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#B45309',
        marginBottom: 2,
    },
    actionRequiredText: {
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
    },
    attachBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: Colors.light.background,
        borderRadius: 12,
    },
    attachText: {
        color: Colors.light.primary,
        fontWeight: '600',
    },
    // New Styles for Timeline Remark
    timelineRemark: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    assignBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#EEF2FF',
        borderRadius: 16,
        marginBottom: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE'
    },
    assignLabel: {
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    assignValue: {
        fontSize: 15,
        color: '#312E81',
        fontWeight: '600'
    },
});

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'High': return '#EF4444';
        case 'Medium': return '#F59E0B';
        case 'Low': return '#10B981';
        default: return '#64748B';
    }
};
