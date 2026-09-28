import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../ctx/ThemeContext';

export default function PrivacyPolicy() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
                <Text style={[styles.lastUpdated, { color: colors.icon }]}>Effective Date: February 17, 2026</Text>

                <View style={styles.section}>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        All the users must read and understand this Privacy Policy as it has been formulated to safeguard the user’s privacy. This Privacy Policy also outlines the ways the users can ensure protection of their personal identifiable information.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        You must accept the contents of this Policy in order to use or continue using our website/App. This Privacy Policy detailed herein is also applicable to user of the site or mobile application through mobile or any other similar device.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Collection of Information</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We confirm that we collect those information from you which is required to extend the services available on the website/App.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        At the time of signing up and registration with the site/App, we collect user information including name, company name, email address, phone/mobile number, postal address and other business information which may also include business statutory details and tax registration numbers.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        In this regard, we may also record conversations and archive correspondence between users and the representatives of the site/App (including the additional information, if any) in relation to the services for quality control or training purposes.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        In case of paid packages we may collect personal information of a more sensitive nature which includes bank account numbers and related details to facilitate the sale or purchase of the services available on the site/App.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We also gathers and stores the user’s usage statistics such as IP addresses, pages viewed, user behaviour pattern, number of sessions and unique visitors, browsing activities, browser software operating system etc. for analysis, which helps us to provide improved experience and value added services to you.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        Once a user registers, the user is no longer anonymous to us and thus all the information provided by you shall be stored, possessed in order to provide you with the requested services and as may be required for compliance with statutory requirements.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        User’s registration with us and providing information is intended for facilitating the users in its business.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We retains user provided Information for as long as the Information is required for the purpose of providing services to you or where the same is required for any purpose for which the Information can be lawfully processed or retained as required under any statutory enactments or applicable laws.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        User may update, correct, or confirm provided information by logging on to their accounts on the site/App or by sending a request to statecoordinator@sabca.co.in. The requested changes may take reasonable time due to verification process and server cache policies. In case you would like to receive a copy of our information held by us for porting to another service, please contact us with your request at the email address above.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        Users may also choose to delete or deactivate their accounts on the site/App. We will evaluate such requests on a case-to-case basis and take the requisite action as per applicable law. In this regard, please note that information sought to be deleted may remain with us in archival records for the purpose of compliance of statutory enactments, or for any other lawful purpose. Therefore, users are requested to carefully evaluate what types of information they would like to provide to us at the time of registration.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        The Privacy Policy of www.sabca.co.in (hereinafter referred to as “site/App") detailed herein below governs the collection, possession, storage, handling and dealing of personal identifiable information/data and sensitive personal data (hereinafter collectively referred to as “information”) of the users of the site/App.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Purpose and Usage of Information</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>The following are the purposes of collecting the Information:</Text>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>For the verification of your identity, eligibility, registration and to provide customized services.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>For facilitating the services offered/available on the site/App.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>For advertising, marketing, displaying & publication.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>For enabling communication with the users of the site/App, so that the users may fetch maximum business opportunities.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>For generating business enquires and trade leads.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>For sending communications, notifications, newsletters and customized mailers etc.</Text>
                    </View>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        Please get in touch with us at the above email address in case you would like to object to any purpose of data processing. However, please note that if you object or withdraw consent to process data as above, we may discontinue providing you with services through our site/App.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Disclosure of Information</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>Information we may collect from you may be disclosed and transferred to external service providers who we rely on to provide services to us or to you directly. For instance, information may be shared with:</Text>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>Affiliated companies for better efficiency, more relevancy, innovative business matchmaking and better personalised services.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>Government or regulatory or law enforcement agencies, as mandated under statutory enactment, for verification of identity or for prevention, detection, investigation including cyber incidents, prosecution and punishment of offences.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>Service provider including but not limited to payment, customer and cloud computing service provider (“Third Party”) engaged for facilitating service requirements of user.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>Business partners for sending their business offers to the users, which are owned and offered by them solely without involvement of the site/App.</Text>
                    </View>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        Links to the websites of any of the above may be available on the site as a convenience to user(s) and the site does not have any control over such websites. The usage of such websites by the user will be governed by their respective Privacy Policies and the present Privacy Policy will not apply to usage of such websites. The users of such websites are cautioned to read the privacy policies of such websites.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        Please get in touch with us at the above email address in case you would like to object to any purpose of data processing. However, please note that if you object or withdraw consent to process data as above, we may discontinue providing you with services through our site/App.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        In relation to such disclosures, receiving parties have consented and confirmed that:
                    </Text>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>There shall be limited disclosure of any Information to its Directors, officers, employees, agents or representatives who have a need to know such Information in connection with the business transaction and are only permitted to use your Information in connection with the said purpose,</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>They shall keep the Information confidential and secure by using a reasonable degree of care, and</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: isDark ? '#94A3B8' : '#475569' }]}>•</Text>
                        <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>They shall not disclose any Information received by them further and must abide by the Privacy Policy of the site/App.</Text>
                    </View>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        Please keep in mind that whenever a user post personal & business information online, the same becomes accessible to the public and the users may receive messages/emails from visitors of the site/App.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Reasonable Protection of Information</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We employ commercially reasonable and industry-standard security measures to prevent unauthorized access, maintain data accuracy and ensure proper use of information we receive.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        These security measures are both electronic as well as physical but at the same time no data transmission over the Internet can be guaranteed to be 100% secure.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We strive to protect the User Information, although we cannot ensure the security of Information furnished/transmitted by the users to us.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We recommend you not to disclose password of your email address, online bank transaction and other important credentials to our employees / agents / affiliates/ personnel, as we do not ask for the same.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We recommend that registered users not to share their site’s account password and also to sign out of their account when they have completed their work. This is to ensure that others cannot access Information of the users and correspondence, if the user shares the computer with someone else or is using a computer in a public place.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Cookies</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We, and third parties with whom we partner, may use cookies, pixel tags, web beacons, mobile device IDs, “flash cookies” and similar files or technologies to collect and store information in respect to your use of the site and track your visits to third party websites.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We also use cookies to recognize your browser software and to provide features such as recommendations and personalization.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        Third parties whose products or services are accessible or advertised through the site/App, including social media sites, may also use cookies or similar tools, and we advise you to check their privacy policies for information about their cookies and the practices followed by them. We do not control the practices of third parties and their privacy policies govern their interactions with you.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Data Collection Relating to Children</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        We strongly believe in protecting the privacy of children. In line with this belief, we do not knowingly collect or maintain Personally Identifiable Information on our Site from persons under 18 years of age, and no part of our Site/App is directed to persons under 18 years of age. If you are under 18 years of age, then please do not use or access our services at any time or in any manner. We will take appropriate steps to delete any Personally Identifiable Information of persons less than 18 years of age that has been collected on our Site without verified parental consent upon learning of the existence of such Personally Identifiable Information.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        If we become aware that a person submitting personal information is under 18, we will delete the account and all related information as soon as possible. If you believe we might have any information from or about a child under 18 please contact us at statecoordinator@sabca.co.in.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Data Transfers</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        User Information that we collect may be transferred to, and stored at, any of our affiliates, partners or service providers which may be inside or outside the country you reside in. By submitting your personal data, you agree to such transfers.
                    </Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        Your Personal Information may be transferred to countries that do not have the same data protection laws as the country in which you initially provided the information. When we transfer or disclose your Personal Information to other countries, we will protect that information as described in this Privacy Policy.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Questions</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        Please contact us regarding any questions, clarifications, or grievances. Please email us at statecoordinator@sabca.co.in.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Grievance Officer</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        In accordance with the applicable laws, the name and details of the Grievance officer are provided below:
                    </Text>
                    <Text style={[styles.text, styles.bold, { color: colors.text }]}>Suresh</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>Email Address: statecoordinator@sabca.co.in</Text>
                    <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        The policy may change from time to time, so users are requested to check it periodically.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    lastUpdated: {
        fontSize: 14,
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    text: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 8,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 8,
    },
    bullet: {
        fontSize: 15,
        marginRight: 8,
        lineHeight: 24,
    },
    bold: {
        fontWeight: 'bold',
    },
});
