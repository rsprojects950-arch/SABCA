import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Switch, Platform, ActivityIndicator, Alert, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { X, Upload, Calendar, MapPin, AlignLeft, Link as LinkIcon, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { supabase, uploadImage } from '../../lib/supabase';
import { useAuth } from '../../ctx/AuthContext';
import { useTheme } from '../../ctx/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';

export default function CreateEventScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const { lightImpact, successFeedback, errorFeedback } = useHaptics();

    const [title, setTitle] = useState('');
    const [eventDate, setEventDate] = useState(new Date());
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [imageUri, setImageUri] = useState('');
    const [attendees, setAttendees] = useState('0');
    const [loading, setLoading] = useState(false);

    // Date Picker States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            // Keep the time from the previous state, only update date
            const newDate = new Date(eventDate);
            newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setEventDate(newDate);
        }
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (selectedDate) {
            // Keep the date, only update time
            const newDate = new Date(eventDate);
            newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
            setEventDate(newDate);
        }
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
        if (!title || !location) {
            errorFeedback();
            Alert.alert('Missing Fields', 'Please fill in the title and location.');
            return;
        }

        setLoading(true);
        try {
            let publicUrl = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80';

            if (imageUri && !imageUri.startsWith('http')) {
                publicUrl = await uploadImage(imageUri, 'events');
            } else if (imageUri) {
                publicUrl = imageUri;
            }

            // Format date for display in the table (The table uses text for date currently based on existing schema, 
            // but standardizing to ISO string or a readable format is better. 
            // Existing data sample: "Oct 15, 2023 • 10:00 AM" which is TEXT. 
            // We should match that format or use ISO if schema was TIMESTAMP. 
            // Checking schema: "date TEXT", so we construct the string manually to match style.)

            // dateStr is YYYY-MM-DD
            const dateStr = eventDate.toISOString().split('T')[0];
            const displayDateStr = eventDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            const timeStr = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const formattedDate = `${displayDateStr} • ${timeStr}`;

            const { error } = await supabase.from('events').insert({
                title,
                description,
                date: formattedDate, // Display text
                event_date: dateStr, // Machine readable date
                location,
                image_url: publicUrl,
                attendees: parseInt(attendees) || 0,
            });

            if (error) throw error;

            successFeedback();
            Alert.alert('Success', 'Event published successfully!');
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Create New Event</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Image Upload */}
                    <TouchableOpacity style={[styles.imageUpload, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => { lightImpact(); pickImage(); }}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Upload size={32} color={colors.primary} />
                                <Text style={[styles.uploadText, { color: colors.primary }]}>Tap to Upload Banner</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Form Fields */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.icon }]}>Event Title</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. Annual Safety Workshop"
                            value={title}
                            onChangeText={setTitle}
                            placeholderTextColor={colors.icon}
                        />
                    </View>

                    {/* Date & Time Pickers */}
                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={[styles.label, { color: colors.icon }]}>Date</Text>
                            <TouchableOpacity
                                style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => {
                                    lightImpact();
                                    setShowDatePicker(!showDatePicker);
                                    setShowTimePicker(false);
                                }}
                            >
                                <Calendar size={20} color={colors.primary} />
                                <Text style={[styles.pickerText, { color: colors.text }]}>
                                    {eventDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                            <Text style={[styles.label, { color: colors.icon }]}>Time</Text>
                            <TouchableOpacity
                                style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => {
                                    lightImpact();
                                    setShowTimePicker(!showTimePicker);
                                    setShowDatePicker(false);
                                }}
                            >
                                <Clock size={20} color={colors.primary} />
                                <Text style={[styles.pickerText, { color: colors.text }]}>
                                    {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Setup Pickers */}
                    {showDatePicker && (
                        <View style={Platform.OS === 'ios' ? [styles.datePickerContainer, { backgroundColor: colors.card, borderColor: colors.border }] : {}}>
                            <DateTimePicker
                                value={eventDate}
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
                    {showTimePicker && (
                        <View style={Platform.OS === 'ios' ? [styles.datePickerContainer, { backgroundColor: colors.card, borderColor: colors.border }] : {}}>
                            <DateTimePicker
                                value={eventDate}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onTimeChange}
                                textColor={colors.text}
                            />
                            {Platform.OS === 'ios' && (
                                <TouchableOpacity
                                    style={[styles.datePickerCloseBtn, { borderTopColor: colors.border }]}
                                    onPress={() => { lightImpact(); setShowTimePicker(false); }}
                                >
                                    <Text style={[styles.datePickerCloseText, { color: colors.primary }]}>Done</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.icon }]}>Location</Text>
                        <View style={styles.inputContainer}>
                            <MapPin size={20} color={colors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.inputWithIcon, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="Visakhapatnam"
                                value={location}
                                onChangeText={setLocation}
                                placeholderTextColor={colors.icon}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.icon }]}>Description</Text>
                        <View style={styles.inputContainer}>
                            <AlignLeft size={20} color={colors.icon} style={[styles.inputIcon, { marginTop: 12 }]} />
                            <TextInput
                                style={[styles.input, styles.inputWithIcon, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="What is this event about?"
                                value={description}
                                onChangeText={setDescription}
                                placeholderTextColor={colors.icon}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.icon }]}>Image URL (Optional)</Text>
                        <View style={styles.inputContainer}>
                            <LinkIcon size={20} color={colors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.inputWithIcon, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="Paste image link..."
                                value={imageUri}
                                onChangeText={setImageUri}
                                placeholderTextColor={colors.icon}
                            />
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Action */}
                <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.publishBtn} onPress={() => { lightImpact(); handlePublish(); }} disabled={loading}>
                        <LinearGradient
                            colors={Colors.gradients.button}
                            style={styles.publishGradient}
                        >
                            <Text style={styles.publishText}>
                                {loading ? 'Publishing...' : 'Publish Event'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    closeBtn: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    imageUpload: {
        height: 200,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    uploadPlaceholder: {
        alignItems: 'center',
        gap: 8,
    },
    uploadText: {
        color: Colors.light.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.light.text,
    },
    row: {
        flexDirection: 'row',
    },
    pickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    pickerText: {
        fontSize: 16,
        color: Colors.light.text,
    },
    inputContainer: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        left: 14,
        top: 14,
        zIndex: 1,
    },
    inputWithIcon: {
        paddingLeft: 44,
    },
    textArea: {
        paddingTop: 12,
        minHeight: 100,
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingBottom: 40,
    },
    publishBtn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    publishGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    publishText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
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
