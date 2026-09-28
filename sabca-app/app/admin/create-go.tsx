import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { X, FileText, Upload, ShieldAlert } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { supabase, uploadFile } from '../../lib/supabase';

import { useTheme } from '../../ctx/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';

export default function CreateGOScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { lightImpact, successFeedback, errorFeedback } = useHaptics();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fileUri, setFileUri] = useState('');
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                setFileUri(result.assets[0].uri);
                setFileName(result.assets[0].name);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handlePublish = async () => {
        if (!title || !fileUri) {
            errorFeedback();
            Alert.alert('Missing Fields', 'Please fill in the title and select a PDF file.');
            return;
        }

        setLoading(true);
        try {
            const publicUrl = await uploadFile(fileUri, 'government_orders', {
                fileName: `${new Date().getTime()}_${fileName}`,
                contentType: 'application/pdf'
            });

            const { error } = await supabase.from('government_orders').insert({
                title,
                description,
                file_url: publicUrl,
            });

            if (error) throw error;

            successFeedback();
            Alert.alert('Success', 'Government Order uploaded successfully!');
            setTimeout(() => {
                router.back();
            }, 1000);
        } catch (e: any) {
            console.error('Upload error:', e);
            errorFeedback();
            Alert.alert('Error', e.message || 'Failed to upload Government Order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} style={styles.closeBtn}>
                    <X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Upload G.O</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.icon }]}>G.O Title</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. Revised Pay Scales 2024"
                            value={title}
                            onChangeText={setTitle}
                            placeholderTextColor={colors.icon}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.icon }]}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                            placeholder="Details about the Government Order..."
                            value={description}
                            onChangeText={setDescription}
                            placeholderTextColor={colors.icon}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <TouchableOpacity style={[styles.fileUpload, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => { lightImpact(); pickDocument(); }}>
                        <View style={styles.uploadPlaceholder}>
                            <FileText size={48} color={fileUri ? colors.success : colors.primary} />
                            <Text style={[styles.uploadText, { color: fileUri ? colors.success : colors.primary }]}>
                                {fileUri ? fileName : 'Tap to select G.O PDF'}
                            </Text>
                            {fileUri && (
                                <Text style={{ fontSize: 12, color: colors.icon, marginTop: 4 }}>Tap to change file</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </ScrollView>

                <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.publishBtn} onPress={() => { lightImpact(); handlePublish(); }} disabled={loading}>
                        <LinearGradient
                            colors={Colors.gradients.button}
                            style={styles.publishGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.publishText}>Upload G.O</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
    closeBtn: { padding: 8 },
    content: { flex: 1, padding: 24 },
    formGroup: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8 },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Colors.light.text },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    fileUpload: { height: 180, backgroundColor: '#F1F5F9', borderRadius: 20, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    uploadPlaceholder: { alignItems: 'center', padding: 20 },
    uploadText: { color: Colors.light.primary, fontWeight: '600', marginTop: 12, textAlign: 'center' },
    footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingBottom: 40 },
    publishBtn: { borderRadius: 16, overflow: 'hidden' },
    publishGradient: { paddingVertical: 16, alignItems: 'center' },
    publishText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
