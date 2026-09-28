import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Upload, ArrowLeft, Check, ChevronDown, CheckCircle } from 'lucide-react-native';
import { PrimaryButton } from '../../../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../ctx/AuthContext';
import { useTheme } from '../../../ctx/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useHaptics } from '../../../hooks/useHaptics';
import { decode } from 'base64-arraybuffer';
import { checkNetworkConnection, checkDuplicateGrievance, retryOperation } from '../../../utils/edge_case_utils';

const CATEGORIES = [
    'Payment Issues',
    'Government Approvals',
    'Contractor Disputes',
    'Legal Issues',
    'Project Delays',
    'Others'
];

export default function CreateGrievanceScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const { lightImpact, mediumImpact } = useHaptics();

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [projectRef, setProjectRef] = useState('');
    const [department, setDepartment] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [loading, setLoading] = useState(false);

    // File Upload State
    const [attachment, setAttachment] = useState<any>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [userDivision, setUserDivision] = useState<string>('');
    const [submittedGrievanceId, setSubmittedGrievanceId] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserDivision = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('division')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                if (data?.division) {
                    setUserDivision(data.division);
                }
            } catch (error) {
                console.error('Error fetching division:', error);
            }
        };

        fetchUserDivision();
    }, [user]);

    const pickDocument = async () => {
        try {
            lightImpact();
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
                multiple: false
            });

            if (result.canceled) return;

            const file = result.assets[0];

            // Check file size (max 5MB)
            if (file.size && file.size > 5 * 1024 * 1024) {
                Alert.alert('File too large', 'The file size is larger than 5MB. Please compress it and try again.');
                return;
            }

            setAttachment(file);

        } catch (error) {

            Alert.alert('Error', 'Failed to pick document.');
        }
    };

    const uploadAttachment = async (grievanceId: string) => {
        if (!attachment) return;

        try {
            const fileExt = attachment.name.split('.').pop();
            const fileName = `${grievanceId}/${Date.now()}.${fileExt}`;
            const fileBase64 = await FileSystem.readAsStringAsync(attachment.uri, { encoding: 'base64' });

            const { data, error } = await supabase.storage
                .from('grievance-attachments')
                .upload(fileName, decode(fileBase64), {
                    contentType: attachment.mimeType
                });

            if (error) throw error;

            const publicUrl = supabase.storage.from('grievance-attachments').getPublicUrl(fileName).data.publicUrl;

            // Insert into attachments table
            const { error: dbError } = await supabase
                .from('grievance_attachments')
                .insert({
                    grievance_id: grievanceId,
                    file_name: attachment.name,
                    file_url: publicUrl,
                    file_type: attachment.mimeType,
                    file_size_bytes: attachment.size
                });

            if (dbError) throw dbError;

        } catch (error) {

            // Non-blocking error, user still submitted grievance successfully
            Alert.alert('Warning', 'Grievance submitted, but file upload failed.');
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to submit a grievance.');
            return;
        }

        // 1. Network Check
        // 1. Network Check
        const isConnected = await checkNetworkConnection();
        if (!isConnected) {
            Alert.alert('No Connection', 'Please check your internet connection and try again.');
            return;
        }

        setLoading(true);

        try {
            // 2. Duplicate Check
            const isDuplicate = await checkDuplicateGrievance(user.id, title);
            if (isDuplicate) {
                // We need to pause and ask user. Since Alert is async but doesn't return promise in RN cleanly for flow,
                // we technically can't block easily without refactoring.
                // However, for this implementation, we will use a separate async confirmation pattern or just error.
                // However, for this implementation, we will use a separate async confirmation pattern or just error.
                // Better UX: Show Alert with "Yes/No".
                setLoading(false);
                Alert.alert('Duplicate Grievance', 'You have already submitted a grievance with a similar title.');
                return;
            }

            await submitGrievance();

        } catch (error: any) {

            Alert.alert('Submission Failed', error.message || 'An unexpected error occurred.');
            setLoading(false);
        }
    };

    const submitGrievance = async () => {
        if (!user) return;
        setLoading(true); // Ensure loading is true if coming from alert callback

        try {
            // 1. Insert Grievance
            const { data, error } = await supabase
                .from('grievances')
                .insert({
                    user_id: user.id,
                    title: title.trim(),
                    category,
                    description: description.trim(),
                    project_ref: projectRef.trim() || null,
                    department: department.trim() || null,
                    priority
                })
                .select()
                .single();

            if (error) throw error;

            if (attachment && data) {
                try {
                    await retryOperation(() => uploadAttachment(data.id));
                } catch (uploadErr) {

                    Alert.alert('Warning', 'Grievance submitted, but file upload failed after multiple attempts.');
                }
            }

            mediumImpact();
            setSubmittedGrievanceId(data.id);
            setLoading(false);
            setShowSuccessModal(true);

        } catch (error: any) {

            Alert.alert('Error', error.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Custom Gradient Header */}
            <LinearGradient
                colors={isDark ? ['rgba(229, 57, 53, 0.2)', 'rgba(142, 68, 173, 0.2)'] : Colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.safeHeader}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/services')} style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <ArrowLeft size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: '#FFF' }]}>New Grievance</Text>
                        <View style={{ width: 24 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Title <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                placeholder="Brief title of the issue"
                                placeholderTextColor={colors.icon}
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Category <Text style={styles.required}>*</Text></Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.chip,
                                            category === cat ?
                                                { backgroundColor: colors.primary, borderWidth: 0 } :
                                                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0', borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.border }
                                        ]}
                                        onPress={() => { lightImpact(); setCategory(cat); }}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            category === cat ? { color: '#FFF', fontWeight: 'bold' } : { color: colors.text }
                                        ]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Description <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                placeholder="Detailed description of the grievance..."
                                placeholderTextColor={colors.icon}
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Project Ref</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                    placeholder="e.g. Site-A1"
                                    placeholderTextColor={colors.icon}
                                    value={projectRef}
                                    onChangeText={setProjectRef}
                                />
                            </View>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Department</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                    placeholder="e.g. Accounts"
                                    placeholderTextColor={colors.icon}
                                    value={department}
                                    onChangeText={setDepartment}
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <View style={{ marginBottom: 12 }}>
                                <Text style={[styles.label, { color: colors.text, marginBottom: 4 }]}>Priority</Text>
                                <Text style={[styles.subLabel, { color: colors.icon, marginLeft: 4 }]}>Priority level can be reviewed and updated by the backend team.</Text>
                            </View>
                            <View style={styles.priorityContainer}>
                                {['Low', 'Medium', 'High'].map(p => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.priorityBtn,
                                            { backgroundColor: colors.background, borderColor: colors.border },
                                            priority === p && styles.activePriorityBtn,
                                            priority === p && {
                                                borderColor: p === 'High' ? '#EF4444' : p === 'Medium' ? '#F59E0B' : '#10B981',
                                                backgroundColor: isDark
                                                    ? (p === 'High' ? 'rgba(239, 68, 68, 0.2)' : p === 'Medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)')
                                                    : (p === 'High' ? '#FEF2F2' : p === 'Medium' ? '#FFFBEB' : '#ECFDF5')
                                            }
                                        ]}
                                        onPress={() => setPriority(p)}
                                    >
                                        <Text style={[
                                            styles.priorityText,
                                            { color: colors.icon },
                                            priority === p && { color: p === 'High' ? '#EF4444' : p === 'Medium' ? '#F59E0B' : '#10B981', fontWeight: 'bold' }
                                        ]}>{p}</Text>
                                        {priority === p && <View style={[styles.priorityDot, { backgroundColor: p === 'High' ? '#EF4444' : p === 'Medium' ? '#F59E0B' : '#10B981' }]} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Attachments</Text>
                            {attachment ? (
                                <View style={[styles.attachmentPreview, { backgroundColor: colors.background, borderColor: colors.success }]}>
                                    <View style={styles.attachmentInfo}>
                                        <CheckCircle size={20} color={colors.success} />
                                        <Text style={[styles.attachmentName, { color: colors.success }]} numberOfLines={1}>{attachment.name}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setAttachment(null)}>
                                        <Text style={[styles.removeText, { color: colors.error }]}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={[styles.uploadBtn, { borderColor: colors.border }]} onPress={pickDocument}>
                                    <LinearGradient
                                        colors={isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['#F8FAFC', '#F1F5F9']}
                                        style={styles.uploadGradient}
                                    >
                                        <Upload size={24} color={colors.primary} />
                                        <Text style={[styles.uploadText, { color: colors.primary }]}>Tap to Upload Document</Text>
                                        <Text style={[styles.uploadSubText, { color: colors.icon }]}>(PDF, JPG, PNG - Max 5MB)</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <PrimaryButton
                        title="Submit Grievance"
                        onPress={handleSubmit}
                        loading={loading}
                        icon={<Check size={20} color="#FFF" />}
                        style={{ marginTop: 8, marginBottom: 40 }}
                    />

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Premium Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                        <LinearGradient
                            colors={isDark ? ['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)'] : ['#ECFDF5', '#D1FAE5']}
                            style={styles.successIconBadge}
                        >
                            <CheckCircle size={48} color={colors.success} />
                        </LinearGradient>

                        <Text style={[styles.successTitle, { color: colors.text }]}>Submission Successful!</Text>
                        
                        <Text style={[styles.successSubtitle, { color: colors.icon }]}>
                            Your grievance has been successfully submitted to the {' '}
                            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                                {userDivision || 'Division Office'}
                            </Text>.
                        </Text>

                        <View style={styles.modalActions}>
                            <PrimaryButton
                                title="Track Status"
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    if (submittedGrievanceId) {
                                        router.push(`/services/grievances/${submittedGrievanceId}`);
                                    } else {
                                        router.push('/(tabs)/services');
                                    }
                                }}
                                style={styles.modalBtn}
                                icon={<ArrowLeft size={18} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />}
                            />
                            
                            <TouchableOpacity 
                                style={[styles.secondaryModalBtn, { borderColor: colors.border }]}
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    router.push('/(tabs)/services');
                                }}
                            >
                                <Text style={[styles.secondaryModalBtnText, { color: colors.text }]}>Back to Services</Text>
                            </TouchableOpacity>
                        </View>
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
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: Colors.light.card,
        borderRadius: 24,
        padding: 24,
        shadowColor: Colors.light.icon,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 24,
    },
    formGroup: {
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    subLabel: {
        fontSize: 12,
        color: Colors.light.icon,
        fontStyle: 'italic',
    },
    required: {
        color: Colors.light.error,
    },
    input: {
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: Colors.light.text,
    },
    textArea: {
        height: 120,
        paddingTop: 16,
    },
    chipContainer: {
        paddingRight: 20,
        paddingBottom: 4,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.light.border,
        marginRight: 8,
    },
    activeChip: {
        backgroundColor: Colors.light.background,
        borderColor: Colors.light.primary,
    },
    chipText: {
        fontSize: 13,
        color: Colors.light.icon,
        fontWeight: '500',
    },
    activeChipText: {
        color: Colors.light.primary,
        fontWeight: '600',
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    priorityBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.background,
        gap: 8,
    },
    activePriorityBtn: {
        borderWidth: 1.5,
    },
    priorityText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.icon,
    },
    priorityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    uploadBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderStyle: 'dashed',
    },
    uploadGradient: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadText: {
        color: Colors.light.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    uploadSubText: {
        color: Colors.light.icon,
        fontSize: 12,
    },
    attachmentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.light.background,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.light.success,
    },
    attachmentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    attachmentName: {
        color: Colors.light.success,
        fontWeight: '600',
        flex: 1,
    },
    removeText: {
        color: Colors.light.error,
        fontWeight: '600',
        fontSize: 12,
        marginLeft: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    successIconBadge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    successSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    modalActions: {
        width: '100%',
        gap: 12,
    },
    modalBtn: {
        width: '100%',
        marginBottom: 0,
    },
    secondaryModalBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryModalBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
