import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Calendar, MapPin, Clock, Star, ArrowRight } from 'lucide-react-native';
import { SecondaryButton } from '../../../components/ui';

const TRAINING_PROGRAMS = [
    {
        id: '1',
        title: 'Advanced Construction Safety',
        category: 'Safety',
        date: 'Feb 15, 2026',
        duration: '2 Days',
        location: 'SABCA Hall, Vizag',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1000'
    },
    {
        id: '2',
        title: 'Project Management Professional',
        category: 'Certification',
        date: 'Mar 01, 2026',
        duration: '4 Weeks',
        location: 'Online',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000'
    },
    {
        id: '3',
        title: 'Sustainable Building Materials',
        category: 'Technical',
        date: 'Mar 20, 2026',
        duration: '1 Day',
        location: 'Vijayawada',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000'
    }
];

export default function TrainingScreen() {
    const router = useRouter();

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/services/training/${item.id}`)}
            activeOpacity={0.9}
        >
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.category}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <View style={styles.ratingBox}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                    <Text style={styles.duration}>{item.duration}</Text>
                </View>

                <Text style={styles.title}>{item.title}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Calendar size={14} color="#64748B" />
                        <Text style={styles.metaText}>{item.date}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MapPin size={14} color="#64748B" />
                        <Text style={styles.metaText}>{item.location}</Text>
                    </View>
                </View>

                <SecondaryButton
                    title="View Details"
                    icon={<ArrowRight size={16} color={Colors.light.primary} />}
                    onPress={() => { }} // Add onPress handler if needed or keep it as non-functional for now as the card is clickable
                    style={{ height: 40, marginTop: 12, backgroundColor: 'transparent', borderColor: Colors.light.primary }}
                    textStyle={{ fontSize: 13, color: Colors.light.primary }}
                />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={TRAINING_PROGRAMS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Skill Development</Text>
                        <Text style={styles.headerSubtitle}>Upgrade your skills with certified courses</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    list: { padding: 20 },
    header: { marginBottom: 20 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.light.text },
    headerSubtitle: { fontSize: 14, color: Colors.light.icon, marginTop: 4 },
    card: {
        backgroundColor: Colors.light.card,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: Colors.light.icon,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    image: { width: '100%', height: 160 },
    badge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
    content: { padding: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.light.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderColor: Colors.light.warning, borderWidth: 1 },
    ratingText: { fontSize: 12, fontWeight: 'bold', color: Colors.light.warning },
    duration: { fontSize: 12, color: Colors.light.icon, fontWeight: '500' },
    title: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: 12 },
    metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: Colors.light.icon },
});
