import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Linking, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Share2, Tag, ExternalLink } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

import { useTheme } from '../../ctx/ThemeContext';

export default function NewsDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [newsItem, setNewsItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchNews();
    }, [id]);

    const fetchNews = async () => {
        try {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setNewsItem(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load news article.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Read this article: ${newsItem?.title}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (loading || !newsItem) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.center}>
                    <Text style={{ color: colors.text }}>Loading Article...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Image
                    source={newsItem.image_url}
                    style={styles.image}
                    contentFit="cover"
                    transition={500}
                />

                <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => router.push({ pathname: '/(tabs)/events', params: { view: 'news' } })}>
                    <ArrowLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={handleShare}>
                    <Share2 size={24} color="#FFF" />
                </TouchableOpacity>

                <View style={[styles.content, { backgroundColor: colors.background }]}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.categoryBadge, { backgroundColor: isDark ? 'rgba(229, 57, 53, 0.1)' : '#EFF6FF' }]}>
                            <Tag size={12} color={colors.primary} />
                            <Text style={[styles.categoryText, { color: colors.primary }]}>{newsItem.category}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Calendar size={14} color={colors.icon} />
                            <Text style={[styles.dateText, { color: colors.icon }]}>{newsItem.date}</Text>
                        </View>
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>{newsItem.title}</Text>

                    <Text style={[styles.summary, { color: colors.icon }]}>{newsItem.summary}</Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.body, { color: colors.text }]}>{newsItem.content}</Text>

                    {newsItem.article_url && (
                        <TouchableOpacity
                            style={[styles.externalLinkBtn, { backgroundColor: colors.primary }]}
                            onPress={() => Linking.openURL(newsItem.article_url)}
                        >
                            <Text style={styles.externalLinkText}>Read Full Article</Text>
                            <ExternalLink size={20} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    image: {
        width: '100%',
        height: 250,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        marginTop: -20,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.light.primary,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 12,
        color: '#64748B',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 12,
    },
    summary: {
        fontSize: 16,
        color: '#475569',
        fontStyle: 'italic',
        lineHeight: 24,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 20,
    },
    body: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 26,
        marginBottom: 16,
    },
    externalLinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.primary,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 20,
        gap: 8,
    },
    externalLinkText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
