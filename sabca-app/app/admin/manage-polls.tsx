import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Plus, Trash2, ChevronDown } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../ctx/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ctx/ThemeContext';
import { DISTRICTS } from '../../constants/Districts';
import { useHaptics } from '../../hooks/useHaptics';

export default function ManagePollsScreen() {
    const router = useRouter();
    const { user, isAdmin, userRole } = useAuth();
    const { t } = useTranslation();
    const { colors, isDark } = useTheme();
    const { lightImpact, successFeedback, errorFeedback } = useHaptics();

    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(['', '']); // Start with 2 empty options
    const [targetAudience, setTargetAudience] = useState<string>('all');
    const [targetDivision, setTargetDivision] = useState<string | null>(null);

    // Default end date to 7 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const [endDate, setEndDate] = useState<Date>(defaultDate);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAudiencePicker, setShowAudiencePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) setEndDate(selectedDate);
    };

    // Authentication Gate
    if (!isAdmin && userRole !== 'moderator') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Unauthorized</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: colors.text }}>You do not have permission to view this page.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleAddOption = () => {
        if (options.length >= 10) {
            errorFeedback();
            Alert.alert("Limit Reached", "You can only add up to 10 options.");
            return;
        }
        lightImpact();
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length <= 2) {
            errorFeedback();
            Alert.alert("Minimum Options Required", "A poll must have at least 2 options.");
            return;
        }
        lightImpact();
        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
    };

    const handleOptionChange = (text: string, index: number) => {
        const newOptions = [...options];
        newOptions[index] = text;
        setOptions(newOptions);
    };

    const handlePublishPoll = async () => {
        if (!question.trim()) {
            errorFeedback();
            Alert.alert("Error", "Please enter a poll question.");
            return;
        }

        const validOptions = options.filter(opt => opt.trim().length > 0);
        if (validOptions.length < 2) {
            errorFeedback();
            Alert.alert("Error", "Please provide at least 2 valid options.");
            return;
        }

        if (endDate <= new Date()) {
            errorFeedback();
            Alert.alert("Error", "End date must be in the future.");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Insert Poll Question
            const { data: pollData, error: pollError } = await supabase
                .from('poll_questions')
                .insert({
                    question: question.trim(),
                    created_by: user!.id,
                    target_audience: targetAudience,
                    target_division: targetDivision,
                    expires_at: endDate.toISOString(),
                    status: 'active'
                })
                .select()
                .single();

            if (pollError) throw pollError;

            // 2. Insert Poll Options
            const optionsToInsert = validOptions.map((optText, idx) => ({
                poll_id: pollData.id,
                option_text: optText.trim(),
                order_index: idx
            }));

            const { error: optionsError } = await supabase
                .from('poll_options')
                .insert(optionsToInsert);

            if (optionsError) {
                // Rollback cleanly if options fail
                await supabase.from('poll_questions').delete().eq('id', pollData.id);
                throw optionsError;
            }

            successFeedback();
            Alert.alert(
                "Success",
                "New poll created successfully! Your community can now vote.",
                [{ text: "OK", onPress: () => { lightImpact(); router.back(); } }]
            );

        } catch (error: any) {
            errorFeedback();
            console.error("Poll Creation Error:", error);
            Alert.alert("Error Creating Poll", error.message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Create New Poll</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Question Input */}
                    <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Poll Question <Text style={{ color: colors.primary }}>*</Text></Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border, color: colors.text }]}
                            placeholder="What do you want to ask the community?"
                            placeholderTextColor={colors.icon}
                            value={question}
                            onChangeText={setQuestion}
                            multiline
                            maxLength={300}
                        />
                        <Text style={[styles.charCount, { color: colors.icon }]}>{question.length}/300</Text>
                    </View>

                    {/* Options Input */}
                    <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Options <Text style={{ color: colors.primary }}>*</Text></Text>

                        {options.map((opt, index) => (
                            <View key={index} style={styles.optionRow}>
                                <View style={[styles.optionInputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                                    <View style={[styles.optionDot, { backgroundColor: colors.primary }]} />
                                    <TextInput
                                        style={[styles.optionInput, { color: colors.text }]}
                                        placeholder={`Option ${index + 1}`}
                                        placeholderTextColor={colors.icon}
                                        value={opt}
                                        onChangeText={(text) => handleOptionChange(text, index)}
                                        maxLength={100}
                                    />
                                </View>
                                {options.length > 2 && (
                                    <TouchableOpacity
                                        style={[styles.removeOptionBtn, { backgroundColor: isDark ? '#451a1a' : '#FEF2F2' }]}
                                        onPress={() => handleRemoveOption(index)}
                                    >
                                        <Trash2 size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        {options.length < 10 && (
                            <TouchableOpacity style={[styles.addOptionBtn, { borderColor: colors.primary }]} onPress={handleAddOption}>
                                <Plus size={20} color={colors.primary} />
                                <Text style={[styles.addOptionText, { color: colors.primary }]}>Add Option</Text>
                            </TouchableOpacity>
                        )}
                        <Text style={[styles.helpText, { color: colors.icon }]}>Minimum 2, Maximum 10 options.</Text>
                    </View>

                    {/* Settings Config */}
                    <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Poll Settings</Text>

                        <View style={styles.settingRow}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>End Date</Text>
                            <TouchableOpacity
                                style={[styles.pickerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}
                                onPress={() => { lightImpact(); setShowDatePicker(!showDatePicker); }}
                            >
                                <Text style={[styles.pickerText, { color: colors.text }]}>
                                    {endDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <View style={Platform.OS === 'ios' ? [styles.datePickerContainer, { backgroundColor: colors.card, borderColor: colors.border }] : {}}>
                                <DateTimePicker
                                    value={endDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    minimumDate={new Date()}
                                    textColor={isDark ? '#FFF' : '#000'}
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

                        <Text style={[styles.settingLabel, { marginTop: 16, marginBottom: 8, color: colors.text }]}>Target Audience</Text>
                        <TouchableOpacity
                            style={[styles.pickerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border, justifyContent: 'space-between' }]}
                            onPress={() => { lightImpact(); setShowAudiencePicker(true); }}
                        >
                            <Text style={[styles.pickerText, { color: colors.text }]} numberOfLines={1}>
                                {targetAudience === 'all' ? 'Everyone' : targetDivision || 'Specific Division'}
                            </Text>
                            <ChevronDown size={20} color={colors.icon} />
                        </TouchableOpacity>

                        {/* Audience picker modal */}
                        <Modal
                            visible={showAudiencePicker}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setShowAudiencePicker(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Target Audience</Text>
                                        <TouchableOpacity onPress={() => setShowAudiencePicker(false)}>
                                            <Text style={[styles.modalCloseText, { color: colors.primary }]}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView style={styles.modalScroll}>
                                        <Text style={[styles.modalSectionTitle, { color: colors.icon }]}>General</Text>
                                        <TouchableOpacity
                                            style={[styles.modalItem, { borderBottomColor: colors.border }]}
                                            onPress={() => {
                                                lightImpact();
                                                setTargetAudience('all');
                                                setTargetDivision(null);
                                                setShowAudiencePicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.modalItemText,
                                                { color: targetAudience === 'all' ? colors.primary : colors.text, fontWeight: targetAudience === 'all' ? 'bold' : 'normal' }
                                            ]}>
                                                Everyone
                                            </Text>
                                            {targetAudience === 'all' && <Check size={20} color={colors.primary} />}
                                        </TouchableOpacity>

                                        <Text style={[styles.modalSectionTitle, { color: colors.icon, marginTop: 16 }]}>Specific Divisions</Text>
                                        {DISTRICTS.map(district => (
                                            <TouchableOpacity
                                                key={district.code}
                                                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                                                onPress={() => {
                                                    lightImpact();
                                                    setTargetAudience('specific_division');
                                                    setTargetDivision(district.name);
                                                    setShowAudiencePicker(false);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.modalItemText,
                                                    {
                                                        color: targetDivision === district.name ? colors.primary : colors.text,
                                                        fontWeight: targetDivision === district.name ? 'bold' : 'normal',
                                                        flex: 1
                                                    }
                                                ]}>
                                                    {district.name}
                                                </Text>
                                                {targetDivision === district.name && <Check size={20} color={colors.primary} />}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.publishBtn, { backgroundColor: colors.primary }, isSubmitting && styles.publishBtnDisabled]}
                    onPress={() => { lightImpact(); handlePublishPoll(); }}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.publishBtnText}>Publish Poll</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        marginTop: 6,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    optionInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    optionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    optionInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
    },
    removeOptionBtn: {
        padding: 10,
        borderRadius: 10,
    },
    addOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 12,
        marginTop: 4,
    },
    addOptionText: {
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 15,
    },
    helpText: {
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    pickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minWidth: 140,
    },
    pickerText: {
        fontSize: 16,
    },
    datePickerContainer: {
        marginTop: 10,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    datePickerCloseBtn: {
        borderTopWidth: 1,
        padding: 15,
        alignItems: 'center',
    },
    datePickerCloseText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '50%',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalCloseText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalScroll: {
        paddingHorizontal: 20,
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalItemText: {
        fontSize: 16,
    },
    modalSectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    publishBtn: {
        padding: 18,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    publishBtnDisabled: {
        opacity: 0.7,
    },
    publishBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
