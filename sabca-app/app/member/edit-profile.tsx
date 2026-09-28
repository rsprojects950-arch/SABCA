import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Image, ActivityIndicator, KeyboardAvoidingView, Modal, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Save, Camera, User, Image as ImageIcon, ChevronDown, CheckCircle } from 'lucide-react-native';
import { PrimaryButton, IconButton } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../ctx/AuthContext';
import { useTheme } from '../../ctx/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors } = useTheme();
    const { t } = useTranslation();

    // Form State
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [location, setLocation] = useState(''); // Treating as Address
    const [gstNumber, setGstNumber] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [spouseName, setSpouseName] = useState('');
    const [anniversaryDate, setAnniversaryDate] = useState<Date | null>(null);
    const [bloodGroup, setBloodGroup] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [contractorClass, setContractorClass] = useState('');

    // DatePicker State
    const [showDobPicker, setShowDobPicker] = useState(false);
    const [showAnniversaryPicker, setShowAnniversaryPicker] = useState(false);
    const [showContractorClassPicker, setShowContractorClassPicker] = useState(false);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user!.id)
                .single();

            if (error) throw error;

            setFullName(data.full_name || '');

            // Strip +91 if present for display
            const rawPhone = data.phone || '';
            setPhone(rawPhone.replace('+91', '').trim());
            setCompanyName(data.company_name || '');
            setLocation(data.location || '');
            setGstNumber(data.gst_number || '');
            setDob(data.dob ? new Date(data.dob) : null);
            setAadhaarNumber(data.aadhaar_number || '');
            setFatherName(data.father_name || '');
            setSpouseName(data.spouse_name || '');
            setAnniversaryDate(data.anniversary_date ? new Date(data.anniversary_date) : null);
            setBloodGroup(data.blood_group || '');
            setAvatarUrl(data.avatar_url);
            setContractorClass(data.contractor_class || '');
        } catch (error: any) {

        } finally {
            setLoading(false);
        }
    };

    const processImageUpload = async (file: ImagePicker.ImagePickerAsset) => {
        try {
            setUploading(true);

            const fileExt = file.uri.split('.').pop()?.split(/\#|\?/)[0] || 'jpg';
            const fileName = `${user!.id}/avatar_${Date.now()}.${fileExt}`;
            const contentType = file.mimeType || 'image/jpeg';

            let base64 = file.base64;

            if (!base64) {
                const response = await fetch(file.uri);
                const blob = await response.blob();
                base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const res = reader.result as string;
                        resolve(res.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            const { error: storageError } = await supabase.storage
                .from('avatars')
                .upload(fileName, decode(base64 as string), {
                    contentType,
                    upsert: false,
                });

            if (storageError) throw storageError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setAvatarUrl(publicUrl);
        } catch (error: any) {
            console.error('Avatar Upload Error:', error);
            Alert.alert('Error', error.message);
        } finally {
            setUploading(false);
        }
    };

    const pickImageFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled) {
                processImageUpload(result.assets[0]);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const takePhotoWithCamera = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Error', 'You need to allow camera access to take a photo.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled) {
                processImageUpload(result.assets[0]);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            const updates = {
                full_name: fullName,

                phone: `+91${phone}`, // Ensure +91 is added
                company_name: companyName,

                location: location,
                gst_number: gstNumber,
                dob: dob ? dob.toISOString().split('T')[0] : null,
                aadhaar_number: aadhaarNumber,
                father_name: fatherName,
                spouse_name: spouseName,
                anniversary_date: anniversaryDate ? anniversaryDate.toISOString().split('T')[0] : null,
                blood_group: bloodGroup,
                avatar_url: avatarUrl,
                contractor_class: contractorClass,
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user!.id);

            if (error) throw error;

            if (error) throw error;

            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <LinearGradient
                colors={['#991B1B', '#581C87', '#1E3A8A']} // Darker Brand Gradient
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('profile.edit.title')}</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={[styles.avatarImage, { borderColor: colors.card }]} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border, borderColor: colors.card }]}>
                                    <User size={40} color="#CBD5E1" />
                                </View>
                            )}

                            <IconButton
                                icon={uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Camera size={20} color="#FFF" />}
                                onPress={takePhotoWithCamera}
                                disabled={uploading}
                                size={36}
                                style={[styles.cameraButton, { backgroundColor: colors.primary, borderColor: colors.card }]}
                            />
                        </View>

                        <TouchableOpacity onPress={pickImageFromGallery} disabled={uploading}>
                            <Text style={[styles.changePhotoText, { color: colors.primary }]}>{t('profile.edit.changePhoto')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.emailReadOnly')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.border, borderColor: colors.border, color: colors.icon }]}
                                value={user?.email || ''}
                                editable={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.fullName')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                placeholderTextColor={colors.icon}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.fatherName', 'Father Name')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                value={fatherName}
                                onChangeText={setFatherName}
                                placeholder="Father's Name"
                                placeholderTextColor={colors.icon}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.spouseName', 'Spouse Name')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                value={spouseName}
                                onChangeText={setSpouseName}
                                placeholder="Spouse's Name (Optional)"
                                placeholderTextColor={colors.icon}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.phoneNumber')}</Text>
                            <View style={styles.phoneContainer}>
                                <View style={[styles.countryCode, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <Text style={[styles.countryCodeText, { color: colors.text }]}>+91</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.phoneInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                    value={phone}
                                    onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                                    placeholder="98765 43210"
                                    placeholderTextColor={colors.icon}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.companyName')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                value={companyName}
                                onChangeText={setCompanyName}
                                placeholder="Your Company Name"
                                placeholderTextColor={colors.icon}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.contractorClass', 'Contractor Class')}</Text>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                                onPress={() => setShowContractorClassPicker(true)}
                            >
                                <Text style={{ color: contractorClass ? colors.text : colors.icon }}>
                                    {contractorClass || 'Select Class (Optional)'}
                                </Text>
                                <ChevronDown size={20} color={colors.icon} />
                            </TouchableOpacity>
                        </View>



                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.address')}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                value={location}
                                onChangeText={setLocation}
                                placeholder="Your full address"
                                placeholderTextColor={colors.icon}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.icon }]}>GST Number</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                value={gstNumber}
                                onChangeText={setGstNumber}
                                placeholder="Enter GST Number"
                                placeholderTextColor={colors.icon}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.aadhaarNumber')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                value={aadhaarNumber}
                                onChangeText={(text) => setAadhaarNumber(text.replace(/[^0-9]/g, ''))}
                                placeholder="12-digit Aadhaar Number"
                                placeholderTextColor={colors.icon}
                                keyboardType="number-pad"
                                maxLength={12}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.dob')}</Text>
                                <TouchableOpacity
                                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }]}
                                    onPress={() => setShowDobPicker(true)}
                                >
                                    <Text style={{ color: dob ? colors.text : colors.icon }}>
                                        {dob ? `${dob.getDate().toString().padStart(2, '0')}/${(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getFullYear()}` : 'Select Date'}
                                    </Text>
                                </TouchableOpacity>
                                {showDobPicker && (
                                    <DateTimePicker
                                        value={dob || new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowDobPicker(false);
                                            if (selectedDate) setDob(selectedDate);
                                        }}
                                    />
                                )}
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.bloodGroup')}</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                    value={bloodGroup}
                                    onChangeText={setBloodGroup}
                                    placeholder="e.g. O+"
                                    placeholderTextColor={colors.icon}
                                    maxLength={3}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.icon }]}>{t('profile.edit.anniversaryDate')}</Text>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }]}
                                onPress={() => setShowAnniversaryPicker(true)}
                            >
                                <Text style={{ color: anniversaryDate ? colors.text : colors.icon }}>
                                    {anniversaryDate ? `${anniversaryDate.getDate().toString().padStart(2, '0')}/${(anniversaryDate.getMonth() + 1).toString().padStart(2, '0')}/${anniversaryDate.getFullYear()}` : 'Select Date (Optional)'}
                                </Text>
                            </TouchableOpacity>
                            {showAnniversaryPicker && (
                                <DateTimePicker
                                    value={anniversaryDate || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowAnniversaryPicker(false);
                                        if (selectedDate) setAnniversaryDate(selectedDate);
                                    }}
                                />
                            )}
                        </View>
                    </View>

                    <View style={styles.saveButtonContainer}>
                        <PrimaryButton
                            title={t('profile.edit.saveChanges')}
                            onPress={handleSave}
                            loading={loading}
                            icon={<Save size={20} color="#FFF" />}
                        />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Contractor Class Modal */}
            <Modal
                visible={showContractorClassPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowContractorClassPicker(false)}
            >
                <TouchableOpacity
                    style={styles.dropdownModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowContractorClassPicker(false)}
                >
                    <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {['Class I', 'Class II', 'Class III', 'Class IV', 'Class V', 'Special Class'].map((cls) => (
                            <TouchableOpacity
                                key={cls}
                                style={[styles.dropdownItem, { backgroundColor: colors.card }]}
                                onPress={() => {
                                    setContractorClass(cls);
                                    setShowContractorClassPicker(false);
                                }}
                            >
                                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{cls}</Text>
                                {contractorClass === cls && <CheckCircle size={16} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
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
    content: {
        padding: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: Colors.light.card,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.light.border,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: Colors.light.card,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.light.primary,
        borderWidth: 3,
        borderColor: Colors.light.card,
    },
    changePhotoText: {
        color: Colors.light.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    form: {
        gap: 20,
        marginBottom: 32,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.icon,
    },
    input: {
        backgroundColor: Colors.light.card,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: Colors.light.text,
    },
    saveButtonContainer: {
        marginTop: 8,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },

    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    countryCode: {
        backgroundColor: Colors.light.card,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        padding: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countryCodeText: {
        fontSize: 16,
        color: Colors.light.text,
        fontWeight: '600',
    },
    phoneInput: {
        flex: 1,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    dropdownModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownList: {
        width: '80%',
        maxHeight: 400,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    dropdownItemText: {
        fontSize: 16,
    }
});
