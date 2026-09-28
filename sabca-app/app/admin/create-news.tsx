import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { X, Upload, Calendar, Link as LinkIcon, AlignLeft, Tag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { supabase, uploadImage } from '../../lib/supabase';


import { useTheme } from '../../ctx/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';

export default function CreateNewsScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { lightImpact, successFeedback, errorFeedback } = useHaptics();


    // Fields based on Schema: title, summary, content, category, image_url, date
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [articleUrl, setArticleUrl] = useState('');
    const [category, setCategory] = useState('');
    const [imageUri, setImageUri] = useState('');
    const [newsDate, setNewsDate] = useState(new Date());
    const [loading, setLoading] = useState(false);

    const [showDatePicker, setShowDatePicker] = useState(false);

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) setNewsDate(selectedDate);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handlePublish = async () => {
        if (!title || !content || !category) {
            errorFeedback();
            Alert.alert('Missing Fields', 'Please fill in title, content, and category.');
            return;
        }

        setLoading(true);
        try {
            let publicUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80';

            if (imageUri) {
                publicUrl = await uploadImage(imageUri, 'news');
            }

            // "date" column in schema is DATE type (YYYY-MM-DD)
            const dateStr = newsDate.toISOString().split('T')[0];

            const { error } = await supabase.from('news').insert({
                title,
                summary,
                content,
                category,
                image_url: publicUrl,
                date: dateStr,
            });

            if (error) throw error;

            successFeedback();
            Alert.alert('Success', 'News published successfully!');
            setTimeout(() => {
                router.back();
            }, 1000);
        } catch (e: any) {
            errorFeedback();
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} style={styles.closeBtn}>
                    <X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Create News</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                    <TouchableOpacity style={[styles.imageUpload, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => { lightImpact(); pickImage(); }}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Upload size={32} color={colors.primary} />
                                <Text style={[styles.uploadText, { color: colors.primary }]}>Tap to Upload Header Image</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.icon }]}>Headline</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. Community Cleanup Success"
                            value={title}
                            onChangeText={setTitle}
                            placeholderTextColor={colors.icon}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={[styles.label, { color: colors.icon }]}>Category</Text>
                            <View style={styles.inputContainer}>
                                <Tag size={20} color={colors.icon} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, styles.inputWithIcon, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                    placeholder="General"
                                    value={category}
                                    onChangeText={setCategory}
                                    placeholderTextColor={colors.icon}
                                />
                            </View>
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                            <Text style={[styles.label, { color: colors.icon }]}>Date</Text>
                            <TouchableOpacity
                                style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => { lightImpact(); setShowDatePicker(!showDatePicker); }}
                            >
                                <Calendar size={20} color={colors.primary} />
                                <Text style={[styles.pickerText, { color: colors.text }]}>
                                    {newsDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showDatePicker && (
                        <View style={Platform.OS === 'ios' ? [styles.datePickerContainer, { backgroundColor: colors.card, borderColor: colors.border }] : {}}>
                            <DateTimePicker
                                value={newsDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                                textColor={colors.text}
                            />
                            {Platform.OS === 'ios' && (
                                <TouchableOpacity
                                    style={[styles.datePickerCloseBtn, { borderTopColor: colors.border }]}
                                    onPress={() => { lightImpact(); setShowDatePicker(false); }}
                                >
                                    <Text style={[styles.datePickerCloseText, { color: colors.primary }]}>Done</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.icon }]}>Summary</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                            placeholder="Short overview..."
                            value={summary}
                            onChangeText={setSummary}
                            placeholderTextColor={colors.icon}
                            multiline
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.icon }]}>Main Content</Text>
                        <View style={styles.inputContainer}>
                            <AlignLeft size={20} color={colors.icon} style={[styles.inputIcon, { marginTop: 12 }]} />
                            <TextInput
                                style={[styles.input, styles.inputWithIcon, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="Write the full news article here..."
                                value={content}
                                onChangeText={setContent}
                                placeholderTextColor={colors.icon}
                                multiline
                                numberOfLines={10}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.icon }]}>External Article URL (Optional)</Text>
                        <View style={styles.inputContainer}>
                            <LinkIcon size={20} color={colors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.inputWithIcon, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="https://example.com/full-article"
                                value={articleUrl}
                                onChangeText={setArticleUrl}
                                placeholderTextColor={colors.icon}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.icon }]}>Image URL</Text>
                        <View style={styles.inputContainer}>
                            <LinkIcon size={20} color={colors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.inputWithIcon, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="https://..."
                                value={imageUri}
                                onChangeText={setImageUri}
                                placeholderTextColor={colors.icon}
                            />
                        </View>
                    </View>

                </ScrollView>

                <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.publishBtn} onPress={() => { lightImpact(); handlePublish(); }} disabled={loading}>
                        <LinearGradient
                            colors={Colors.gradients.button}
                            style={styles.publishGradient}
                        >
                            <Text style={styles.publishText}>{loading ? 'Publishing...' : 'Publish News'}</Text>
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
    content: { flex: 1, padding: 20 },
    imageUpload: { height: 160, backgroundColor: '#F1F5F9', borderRadius: 16, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%' },
    uploadPlaceholder: { alignItems: 'center', gap: 8 },
    uploadText: { color: Colors.light.primary, fontWeight: '600' },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8 },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Colors.light.text },
    row: { flexDirection: 'row' },
    inputContainer: { position: 'relative' },
    inputIcon: { position: 'absolute', left: 14, top: 14, zIndex: 1 },
    inputWithIcon: { paddingLeft: 44 },
    textArea: { paddingTop: 12, minHeight: 150, textAlignVertical: 'top' },
    pickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    pickerText: { fontSize: 16, color: Colors.light.text },
    footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingBottom: 40 },
    publishBtn: { borderRadius: 16, overflow: 'hidden' },
    publishGradient: { paddingVertical: 16, alignItems: 'center' },
    publishText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    datePickerContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    datePickerCloseBtn: {
        backgroundColor: 'transparent',
        padding: 10,
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    datePickerCloseText: {
        color: Colors.light.primary,
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 10,
    },
});
