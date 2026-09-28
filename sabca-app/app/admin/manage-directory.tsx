import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Users, Trash2, ChevronDown, X as XIcon, Edit3, Save } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../ctx/ThemeContext';
import { supabase } from '../../lib/supabase';
import { DISTRICTS } from '../../constants/Districts';
import { useHaptics } from '../../hooks/useHaptics';

export default function ManageDirectoryScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { lightImpact, successFeedback, errorFeedback } = useHaptics();

    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const scrollViewRef = React.useRef<ScrollView>(null);

    // Form State
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [division, setDivision] = useState<string>('STATE');
    const [showDivisionPicker, setShowDivisionPicker] = useState(false);

    const divisionsList = [{ name: 'State', code: 'STATE' }, ...DISTRICTS];

    useEffect(() => {
        fetchContacts();
    }, [division]); // Refetch when division changes to show current contacts

    const fetchContacts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('directory_contacts')
            .select('*')
            .eq('division', division)
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: true });

        if (!error && data) {
            setContacts(data);
        }
        setLoading(false);
    };

    const handleAddContact = async () => {
        if (!name.trim() || !designation.trim()) {
            errorFeedback();
            Alert.alert("Error", "Name and Designation are required.");
            return;
        }

        if (phone.trim()) {
            const digits = phone.replace(/[^0-9]/g, '');
            if (digits.length > 0 && digits.length !== 10) {
                errorFeedback();
                Alert.alert("Error", "Phone number must be exactly 10 digits if provided.");
                return;
            }
        }

        setSubmitting(true);

        let error;

        if (editingContactId) {
            const { error: updateError } = await supabase.from('directory_contacts').update({
                name: name.trim(),
                designation: designation.trim(),
                email: email.trim() || null,
                phone: phone.trim() ? `+91${phone.trim().replace(/[^0-9]/g, '')}` : null,
                address: address.trim() || null,
                division: division,
            }).eq('id', editingContactId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('directory_contacts').insert({
                name: name.trim(),
                designation: designation.trim(),
                email: email.trim() || null,
                phone: phone.trim() ? `+91${phone.trim().replace(/[^0-9]/g, '')}` : null,
                address: address.trim() || null,
                division: division,
                order_index: 0
            });
            error = insertError;
        }

        if (error) {
            errorFeedback();
            Alert.alert("Error", `Failed to ${editingContactId ? 'update' : 'add'} contact: ` + error.message);
        } else {
            successFeedback();
            Alert.alert("Success", `Contact ${editingContactId ? 'updated' : 'added'} successfully!`);
            // Reset form
            resetForm();
            fetchContacts();
        }
        setSubmitting(false);
    };

    const resetForm = () => {
        setEditingContactId(null);
        setName('');
        setDesignation('');
        setEmail('');
        setPhone('');
        setAddress('');
    };

    const handleEditContact = (contact: any) => {
        lightImpact();
        setEditingContactId(contact.id);
        setName(contact.name || '');
        setDesignation(contact.designation || '');
        setEmail(contact.email || '');
        setPhone(contact.phone ? contact.phone.replace('+91', '') : '');
        setAddress(contact.address || '');
        setDivision(contact.division);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    const handleDeleteContact = (id: string) => {
        Alert.alert(
            "Delete Contact",
            "Are you sure you want to delete this contact?",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        lightImpact();
                        const { error } = await supabase.from('directory_contacts').delete().eq('id', id);
                        if (error) {
                            errorFeedback();
                            Alert.alert("Error", "Failed to delete contact.");
                        } else {
                            successFeedback();
                            fetchContacts();
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Directory</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.icon }]}>Add or remove contacts</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} ref={scrollViewRef}>

                {/* Division Selector */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Select Division to Manage</Text>
                    <TouchableOpacity
                        style={[styles.dropdownSelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', borderColor: colors.border }]}
                        onPress={() => { lightImpact(); setShowDivisionPicker(true); }}
                    >
                        <Text style={[styles.dropdownText, { color: colors.text }]}>
                            {divisionsList.find(d => d.code === division)?.name || 'Select Division'}
                        </Text>
                        <ChevronDown size={20} color={colors.icon} />
                    </TouchableOpacity>
                </View>

                {/* Add/Edit Contact Form */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: editingContactId ? colors.primary : colors.border, borderWidth: editingContactId ? 2 : 1 }]}>
                    <View style={styles.cardHeader}>
                        <Users size={20} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{editingContactId ? 'Edit Contact' : 'Add New Contact'}</Text>
                    </View>

                    <Text style={[styles.label, { color: colors.text }]}>Full Name <Text style={{ color: '#EF4444' }}>*</Text></Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                        placeholder="e.g., Venkat Naidu"
                        placeholderTextColor={colors.icon}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={[styles.label, { color: colors.text }]}>Designation <Text style={{ color: '#EF4444' }}>*</Text></Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                        placeholder="e.g., Division Head"
                        placeholderTextColor={colors.icon}
                        value={designation}
                        onChangeText={setDesignation}
                    />

                    <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                        placeholder="e.g., mail@example.com"
                        placeholderTextColor={colors.icon}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
                    <View style={[styles.phoneInputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', borderColor: colors.border }]}>
                        <Text style={[styles.phonePrefix, { color: colors.text }]}>+91</Text>
                        <View style={[styles.phoneDivider, { backgroundColor: colors.border }]} />
                        <TextInput
                            style={[styles.phoneInput, { color: colors.text }]}
                            placeholder="91234 56789"
                            placeholderTextColor={colors.icon}
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
                            maxLength={10}
                        />
                    </View>

                    <Text style={[styles.label, { color: colors.text }]}>Address</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: colors.text, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' }]}
                        placeholder="e.g., 123 Main St, City, State"
                        placeholderTextColor={colors.icon}
                        multiline
                        value={address}
                        onChangeText={setAddress}
                    />

                    <View style={styles.actionButtonsRow}>
                        {editingContactId && (
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: isDark ? '#334155' : '#E2E8F0', flex: 1 }]}
                                onPress={() => { lightImpact(); resetForm(); }}
                                disabled={submitting}
                            >
                                <XIcon size={20} color={isDark ? '#F8FAFC' : '#1E293B'} />
                                <Text style={[styles.submitButtonText, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary, flex: 1 }, submitting && { opacity: 0.7 }]}
                            onPress={() => { lightImpact(); handleAddContact(); }}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    {editingContactId ? <Save size={20} color="#FFF" /> : <Plus size={20} color="#FFF" />}
                                    <Text style={styles.submitButtonText}>{editingContactId ? 'Update Contact' : 'Add Contact'}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Existing Contacts List */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 16 }]}>
                        Current Contacts in {divisionsList.find(d => d.code === division)?.name}
                    </Text>

                    {loading ? (
                        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                    ) : contacts.length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.icon }]}>No contacts added yet.</Text>
                    ) : (
                        contacts.map((contact, index) => (
                            <View key={contact.id} style={[styles.contactListItem, { borderBottomColor: colors.border, borderBottomWidth: index === contacts.length - 1 ? 0 : 1 }]}>
                                <View style={styles.contactListInfo}>
                                    <Text style={[styles.contactListName, { color: colors.text }]}>{contact.name}</Text>
                                    <Text style={[styles.contactListRole, { color: colors.icon }]}>{contact.designation}</Text>
                                    {contact.address && (
                                        <Text style={[styles.contactListAddress, { color: colors.icon, marginTop: 4 }]} numberOfLines={2}>
                                            {contact.address}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.contactListActions}>
                                    <TouchableOpacity
                                        style={styles.actionBtnIcon}
                                        onPress={() => handleEditContact(contact)}
                                    >
                                        <Edit3 size={20} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionBtnIcon}
                                        onPress={() => { lightImpact(); handleDeleteContact(contact.id); }}
                                    >
                                        <Trash2 size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>

            {/* Division Picker Modal */}
            <Modal visible={showDivisionPicker} animationType="slide" transparent={true} onRequestClose={() => { lightImpact(); setShowDivisionPicker(false); }}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: 40 }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Division</Text>
                            <TouchableOpacity onPress={() => { lightImpact(); setShowDivisionPicker(false); }}>
                                <XIcon size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={divisionsList}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        lightImpact();
                                        setDivision(item.code);
                                        setShowDivisionPicker(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        { color: division === item.code ? colors.primary : colors.text },
                                        division === item.code && { fontWeight: 'bold' }
                                    ]}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 16,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 13,
    },
    content: {
        padding: 16,
        gap: 16,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        marginBottom: 16,
        borderWidth: 1,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 16,
        paddingHorizontal: 12,
    },
    phonePrefix: {
        fontSize: 15,
        fontWeight: '500',
        paddingRight: 10,
    },
    phoneDivider: {
        width: 1,
        height: 20,
        marginRight: 10,
    },
    phoneInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
        marginTop: 8,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    divisionChipsContainer: {
        flexDirection: 'row',
        paddingBottom: 8,
    },
    divisionChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
    },
    divisionChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    contactListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    contactListInfo: {
        flex: 1,
    },
    contactListName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    contactListRole: {
        fontSize: 14,
    },
    contactListAddress: {
        fontSize: 13,
    },
    contactListActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtnIcon: {
        padding: 8,
        marginLeft: 4,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    emptyText: {
        textAlign: 'center',
        fontStyle: 'italic',
        paddingVertical: 20,
    },
    dropdownSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
    },
    dropdownText: {
        fontSize: 15,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
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
    modalItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    modalItemText: {
        fontSize: 16,
    }
});
