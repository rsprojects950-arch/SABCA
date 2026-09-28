import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { supabase, deleteFileFromUrl } from '../../lib/supabase';
import { useAuth } from '../../ctx/AuthContext';
import { useTheme } from '../../ctx/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Plus, FileText, Image as ImageIcon, Trash2, Download, X } from 'lucide-react-native';
import { PrimaryButton } from '../../components/ui';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export default function DocumentsScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchDocuments();
        }
    }, [user]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', user!.id)
                .order('upload_date', { ascending: false });

            if (error) {
                console.error('Fetch error:', error);
                throw error;
            }

            setDocuments(data || []);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setUploading(true);

            // 1. Read file as base64
            let base64 = await FileSystem.readAsStringAsync(file.uri, {
                encoding: 'base64',
            });

            // 2. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
            const contentType = file.mimeType || 'application/octet-stream';

            const { data: storageData, error: storageError } = await supabase.storage
                .from('documents')
                .upload(fileName, decode(base64), {
                    contentType,
                    upsert: false,
                });

            if (storageError) throw storageError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            // 4. Insert into Database
            const { error: dbError } = await supabase
                .from('documents')
                .insert([
                    {
                        user_id: user!.id,
                        title: file.name,
                        type: file.mimeType?.includes('image') ? 'img' : 'pdf',
                        file_url: publicUrl,
                        size: (file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'),
                    }
                ]);

            if (dbError) throw dbError;

            Alert.alert('Success', 'Document uploaded successfully');
            fetchDocuments();
        } catch (error: any) {
            console.error('Upload Error:', error);
            Alert.alert('Upload Failed', error.message || 'Something went wrong');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, fileUrl: string) => {
        Alert.alert(
            'Delete Document',
            'Are you sure you want to delete this document?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (fileUrl) {
                                await deleteFileFromUrl(fileUrl, 'documents');
                            }

                            const { error } = await supabase
                                .from('documents')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;

                            fetchDocuments();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                {item.type === 'pdf' ? (
                    <FileText size={24} color={Colors.light.primary} />
                ) : (
                    <ImageIcon size={24} color={Colors.light.success} />
                )}
            </View>
            <View style={styles.docInfo}>
                <Text style={[styles.docTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.docMeta, { color: colors.icon }]}>{item.upload_date} • {item.size}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.file_url)} style={styles.deleteBtn}>
                <Trash2 size={20} color={Colors.light.error} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <LinearGradient
                colors={['#1E293B', '#0F172A']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Documents</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            {/* Upload Button */}
            <View style={styles.actionContainer}>
                <PrimaryButton
                    title="Upload New Document"
                    onPress={handleUpload}
                    loading={uploading}
                    icon={<Plus size={20} color="#FFF" />}
                />
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={documents}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <FileText size={48} color={colors.icon} />
                            <Text style={[styles.emptyText, { color: colors.icon }]}>No documents uploaded yet</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    actionContainer: {
        padding: 20,
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    card: {
        backgroundColor: Colors.light.card,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: Colors.light.icon,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    docInfo: {
        flex: 1,
    },
    docTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 4,
    },
    docMeta: {
        fontSize: 12,
        color: Colors.light.icon,
    },
    deleteBtn: {
        padding: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.light.icon,
    },
});
