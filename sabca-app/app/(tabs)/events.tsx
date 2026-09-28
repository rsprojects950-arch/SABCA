import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, useWindowDimensions, TextInput, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, Users, Plus, ArrowRight, ChevronRight, ImageIcon, Check, Trash2 } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../ctx/AuthContext';
import { supabase, deleteFileFromUrl } from '../../lib/supabase';
import { EventCardSkeleton, NewsRowSkeleton, PollCardSkeleton } from '../../components/Skeleton';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTheme } from '../../ctx/ThemeContext';
import { DISTRICTS } from '../../constants/Districts';
import { useHaptics } from '../../hooks/useHaptics';

// --- Memoized Components ---

const EventItem = memo(({ item, isRegistered, isMembershipActive, onPress, onRegister, onDelete, canDelete, colors, isDark, lightImpact }: { item: any, isRegistered: boolean, isMembershipActive: boolean, onPress: (id: string) => void, onRegister: (item: any) => void, onDelete: (id: string, imageUrl?: string) => void, canDelete: boolean, colors: any, isDark: boolean, lightImpact: () => void }) => {
    const { t } = useTranslation();
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.cardContainer}
            onPress={() => { lightImpact(); onPress(item.id); }}
        >
            <LinearGradient
                colors={isDark ? ['#E5393540', '#8E44AD40', '#3B82F640'] : ['#E5393580', '#8E44AD80', '#3B82F680']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.cardGradientBorder, { shadowColor: colors.shadow }]}
            >
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />

                    {/* Date Badge */}
                    <BlurView intensity={30} tint="dark" style={styles.dateBadge}>
                        <Calendar size={14} color="#FFD700" />
                        <Text style={styles.dateText}>{item.date?.split('•')[0].trim()}</Text>
                    </BlurView>

                    {/* Delete Functionality */}
                    {canDelete && (
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => { lightImpact(); onDelete(item.id, item.image_url); }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <BlurView intensity={30} tint="dark" style={styles.deleteBtnBlur}>
                                <Trash2 size={16} color="#EF4444" />
                            </BlurView>
                        </TouchableOpacity>
                    )}

                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                        <View style={styles.cardMetaRow}>
                            <MapPin size={16} color={colors.icon} />
                            <Text style={[styles.cardMetaText, { color: colors.icon }]}>{item.location}</Text>
                        </View>
                        <View style={styles.cardMetaRow}>
                            <Users size={16} color={colors.icon} />
                            <Text style={[styles.cardMetaText, { color: colors.icon }]}>{item.attendees} {t('events.attending')}</Text>
                        </View>
                        <Text style={[styles.cardDescription, { color: colors.icon }]} numberOfLines={2}>{item.description}</Text>

                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                isRegistered && styles.registeredBtn,
                                !isRegistered && !isMembershipActive && { backgroundColor: isDark ? 'rgba(71, 85, 105, 0.2)' : '#F1F5F9', borderColor: colors.border, borderWidth: 1 },
                                { backgroundColor: isRegistered ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5') : ((!isRegistered && !isMembershipActive) ? (isDark ? 'rgba(71, 85, 105, 0.2)' : '#F1F5F9') : colors.primary) }
                            ]}
                            onPress={() => { lightImpact(); onRegister(item); }}
                            disabled={isRegistered || !isMembershipActive}
                        >
                            <Text style={[
                                styles.actionBtnText,
                                isRegistered && styles.registeredBtnText,
                                !isRegistered && !isMembershipActive && { color: colors.icon }
                            ]}>
                                {isRegistered ? t('common.registered') : (isMembershipActive ? t('common.registerNow') : t('events.paidOnly'))}
                            </Text>
                            {isRegistered ? (
                                <Check size={16} color="#10B981" />
                            ) : (
                                <ArrowRight size={16} color={isMembershipActive ? "#FFF" : colors.icon} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
});

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const d = date.getDate();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = monthNames[date.getMonth()];
        const y = date.getFullYear();

        return `${m} ${d}, ${y}`;
    } catch {
        return dateString;
    }
};

const NewsItem = memo(({ item, onPress, onDelete, canDelete, colors, isDark, lightImpact }: { item: any, onPress: (id: string) => void, onDelete: (id: string, imageUrl?: string) => void, canDelete: boolean, colors: any, isDark: boolean, lightImpact: () => void }) => {
    const { t } = useTranslation();
    return (
        <TouchableOpacity
            style={styles.newsCardContainer}
            onPress={() => { lightImpact(); onPress(item.id); }}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={isDark ? ['#E5393590', '#8E44AD90', '#3B82F690'] : ['#E53935BF', '#8E44ADBF', '#3B82F6BF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.newsGradientBorder, { shadowColor: colors.shadow }]}
            >
                <View style={[styles.newsCard, { backgroundColor: colors.card }]}>
                    <View style={styles.newsImageContainer}>
                        <Image source={{ uri: item.image_url }} style={styles.newsImage} contentFit="cover" transition={300} />
                    </View>

                    {/* Delete Button */}
                    {canDelete && (
                        <TouchableOpacity
                            style={[styles.newsDeleteBtn, { backgroundColor: isDark ? '#334155' : '#FFF' }]}
                            onPress={() => { lightImpact(); onDelete(item.id, item.image_url); }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                    )}

                    <View style={styles.newsContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={[styles.newsTitle, { color: colors.text, flex: 1, marginRight: 8, marginBottom: 0 }]} numberOfLines={2}>{item.title}</Text>

                            <View style={[styles.newsInlineDateBadge, { marginTop: 2 }]}>
                                <Calendar size={12} color="#FFD700" />
                                <Text style={{ fontSize: 12, color: '#FFD700', fontWeight: 'bold' }}>{formatDate(item.date)}</Text>
                            </View>
                        </View>

                        <Text style={[styles.newsSummary, { color: colors.icon }]} numberOfLines={2}>{item.summary}</Text>

                        <View style={styles.readMoreContainer}>
                            <Text style={[styles.readMoreText, { color: colors.primary }]}>{t('events.readArticle')}</Text>
                            <ArrowRight size={12} color={colors.primary} />
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
});

const DirectoryDivisionItem = memo(({ item, onPress, colors, isDark, lightImpact }: { item: any, onPress: (divisionCode: string, divisionName: string) => void, colors: any, isDark: boolean, lightImpact: () => void }) => {
    return (
        <TouchableOpacity
            style={[styles.directoryCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => { lightImpact(); onPress(item.code, item.name); }}
            activeOpacity={0.8}
        >
            <View style={styles.directoryCardContent}>
                <View style={[styles.directoryIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
                    <Users size={24} color={isDark ? '#34D399' : '#10B981'} />
                </View>
                <View style={styles.directoryTextContainer}>
                    <Text style={[styles.directoryTitle, { color: colors.text, marginBottom: 0 }]}>{item.name}</Text>
                </View>
                <ChevronRight size={20} color={colors.icon} />
            </View>
        </TouchableOpacity>
    );
});


const PAGE_SIZE = 10;

const EventsScreen = (() => {
    const router = useRouter();
    const { isAdmin, user, isMembershipActive, userRole } = useAuth();
    const { width } = useWindowDimensions();
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const { lightImpact } = useHaptics();

    const { view } = useLocalSearchParams<{ view: string }>();

    // State
    const [viewMode, setViewMode] = useState<'events' | 'news' | 'polls' | 'directory'>('events');
    const [events, setEvents] = useState<any[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [polls, setPolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [userRegistrations, setUserRegistrations] = useState<Set<string>>(new Set());

    // Pagination State
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (view) {
            if (view === 'news') setViewMode('news');
            else if (view === 'polls') setViewMode('polls');
            else if (view === 'directory') setViewMode('directory');
            else setViewMode('events');
        }
    }, [view]);

    // Reset pagination when view mode changes
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        if (viewMode === 'events') setEvents([]);
        if (viewMode === 'news') setNews([]);
        if (viewMode === 'polls') setPolls([]);

        // React Query handles fetching automatically
    }, [viewMode]);

    // React Query for Data Fetching
    const fetchContent = async ({ pageParam = 0 }) => {
        const from = pageParam * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        let query;

        if (viewMode === 'events') {
            query = supabase
                .from('events')
                .select('id, title, date, location, attendees, description, image_url', { count: 'exact' })
                .order('date', { ascending: true })
                .range(from, to);
        } else if (viewMode === 'news') {
            query = supabase
                .from('news')
                .select('id, title, date, summary, category, image_url', { count: 'exact' })
                .order('date', { ascending: false })
                .range(from, to);
        } else if (viewMode === 'polls') {
            // We use our custom service hook, simulating pagination for now
            const { fetchAllPolls } = require('../services/polls');
            const data = await fetchAllPolls(user?.id);
            return {
                data: data.slice(from, to + 1), // manual slice since service handles all currently
                nextCursor: data.length > to + 1 ? pageParam + 1 : undefined
            };
        }

        if (!query && viewMode !== 'directory') return { data: [], nextCursor: undefined };
        if (viewMode === 'directory') return { data: [], nextCursor: undefined }; // Directory doesn't use this fetcher

        const response = await query;
        const data = response?.data;
        const error = response?.error;
        const count = response?.count;
        if (error) throw error;

        return {
            data,
            nextCursor: (data?.length === PAGE_SIZE && count && to < count - 1) ? pageParam + 1 : undefined
        };
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
        isRefetching
    } = useInfiniteQuery({
        queryKey: ['content', viewMode, user?.id],
        queryFn: fetchContent,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    // Flatten data from pages
    const contentData = data?.pages.flatMap(page => (page.data as any[]) || []) || [];

    // Sync state for backwards compatibility with existing render methods
    useEffect(() => {
        if (viewMode === 'events') setEvents(contentData as any);
        else if (viewMode === 'news') setNews(contentData as any);
        else if (viewMode === 'polls') setPolls(contentData as any);
    }, [data, viewMode]);

    // Realtime Subscriptions
    useEffect(() => {
        if (viewMode !== 'polls') return;

        const channel = supabase
            .channel('public:polls_updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'poll_votes' },
                () => {
                    refetch();
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'poll_questions' },
                () => {
                    refetch();
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'poll_questions' },
                () => {
                    refetch();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [viewMode, refetch]);

    // User Registrations Query
    const { data: userRegs, refetch: refetchUserRegs } = useQuery({
        queryKey: ['user_registrations', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data } = await supabase
                .from('event_registrations')
                .select('event_id')
                .eq('user_id', user.id);
            return data?.map(r => r.event_id) || [];
        },
        enabled: !!user && viewMode === 'events',
    });

    useEffect(() => {
        if (userRegs) {
            setUserRegistrations(new Set(userRegs));
        }
    }, [userRegs]);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                if (viewMode === 'events') {
                    refetchUserRegs();
                } else if (viewMode === 'polls') {
                    refetch();
                }
            }
        }, [user, viewMode, refetchUserRegs, refetch])
    );

    const loadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const [registrationModalVisible, setRegistrationModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [registrationStep, setRegistrationStep] = useState<'form' | 'success'>('form');

    // Auto-fill State
    const [registrantName, setRegistrantName] = useState('');
    const [registrantEmail, setRegistrantEmail] = useState('');

    const handleRegister = useCallback(async (event: any) => {
        if (!isMembershipActive) {
            Alert.alert(
                t('profile.renewal.expired'),
                t('profile.renewal.renewDesc'),
                [
                    { text: t('common.cancel'), style: "cancel" },
                    { text: t('common.renew'), onPress: () => router.push('/member/renew') }
                ]
            );
            return;
        }

        if (userRegistrations.has(event.id)) {
            Alert.alert(t('events.alreadyRegistered'), t('events.alreadyRegisteredDesc'));
            return;
        }

        setSelectedEvent(event);
        setRegistrationStep('form');

        // Auto-fill details
        setRegistrantEmail(user?.email || '');

        try {
            const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user!.id)
                .single();

            if (data) {
                setRegistrantName(data.full_name || '');
            }
        } catch (error) {

        }

        setRegistrationModalVisible(true);
    }, [user, userRegistrations]);

    const confirmRegistration = async () => {
        try {
            const { error } = await supabase
                .from('event_registrations')
                .insert({
                    event_id: selectedEvent.id,
                    user_id: user!.id
                });

            if (error) throw error;

            // Update local state
            setUserRegistrations(prev => new Set(prev).add(selectedEvent.id));
            setEvents(prev => prev.map(e =>
                e.id === selectedEvent.id
                    ? { ...e, attendees: (e.attendees || 0) + 1 }
                    : e
            ));

            setRegistrationStep('success');

        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        }
    };

    const closeRegistration = () => {
        setRegistrationModalVisible(false);
        setSelectedEvent(null);
    };

    const handleCreateEvent = () => {
        router.push('/admin/create-event');
    };

    const handleDeleteEvent = useCallback(async (eventId: string, imageUrl?: string) => {
        Alert.alert(
            t('events.deleteEvent'),
            t('events.deleteConfirm'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (imageUrl) {
                                await deleteFileFromUrl(imageUrl, 'events');
                            }

                            const { error } = await supabase
                                .from('events')
                                .delete()
                                .eq('id', eventId);

                            if (error) throw error;

                            // Remove from local state immediately
                            setEvents(prev => prev.filter(e => e.id !== eventId));
                            Alert.alert(t('common.success'), "Event deleted successfully");
                        } catch (error) {
                            Alert.alert(t('common.error'), "Failed to delete event");
                            console.error(error);
                        }
                    }
                }
            ]
        );
    }, []);

    const handleDeleteNews = useCallback(async (newsId: string, imageUrl?: string) => {
        Alert.alert(
            t('events.deleteNews'),
            t('events.deleteConfirm'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (imageUrl) {
                                await deleteFileFromUrl(imageUrl, 'news');
                            }

                            const { error } = await supabase.from('news').delete().eq('id', newsId);
                            if (error) throw error;
                            setNews(prev => prev.filter(n => n.id !== newsId));
                            Alert.alert(t('common.success'), "News deleted successfully");
                        } catch (error) {
                            Alert.alert(t('common.error'), "Failed to delete news");
                        }
                    }
                }
            ]
        );
    }, []);


    // --- Render Functions with Callback ---
    const navigateToEvent = useCallback((id: string) => {
        router.push(`/events/${id}`);
    }, [router]);

    const navigateToNews = useCallback((id: string) => {
        router.push(`/news/${id}`);
    }, [router]);

    const navigateToDirectory = useCallback((code: string, name: string) => {
        router.push({ pathname: '/directory/[division]' as any, params: { division: code, name } });
    }, [router]);


    const renderEventItem = useCallback(({ item }: { item: any }) => (
        <EventItem
            item={item}
            isRegistered={userRegistrations.has(item.id)}
            isMembershipActive={isMembershipActive}
            onPress={navigateToEvent}
            onRegister={handleRegister}
            onDelete={handleDeleteEvent}
            canDelete={isAdmin || userRole === 'moderator'}
            colors={colors}
            isDark={isDark}
            lightImpact={lightImpact}
        />
    ), [userRegistrations, isMembershipActive, navigateToEvent, handleRegister, handleDeleteEvent, isAdmin, userRole, colors, isDark, lightImpact]);

    const renderNewsItem = useCallback(({ item }: { item: any }) => (
        <NewsItem
            item={item}
            onPress={navigateToNews}
            onDelete={handleDeleteNews}
            canDelete={isAdmin || userRole === 'moderator'}
            colors={colors}
            isDark={isDark}
            lightImpact={lightImpact}
        />
    ), [navigateToNews, handleDeleteNews, isAdmin, userRole, colors, isDark, lightImpact]);

    const renderDirectoryItem = useCallback(({ item }: { item: any }) => (
        <DirectoryDivisionItem
            item={item}
            onPress={navigateToDirectory}
            colors={colors}
            isDark={isDark}
            lightImpact={lightImpact}
        />
    ), [navigateToDirectory, colors, isDark, lightImpact]);


    // Polls Rendering
    const [votingPollId, setVotingPollId] = useState<string | null>(null);

    const handleVoteList = async (pollId: string, optionId: string) => {
        if (!user) return;
        setVotingPollId(pollId);
        const { submitVote, fetchPollResults } = require('../services/polls');
        const { success } = await submitVote(pollId, optionId, user.id);

        if (success) {
            const results = await fetchPollResults(pollId);
            setPolls(prev => prev.map(p => {
                if (p.id === pollId) {
                    return { ...p, my_vote: optionId, results };
                }
                return p;
            }));
        } else {
            Alert.alert("Error", "Vote failed");
        }
        setVotingPollId(null);
    };

    const handleDeletePoll = useCallback((pollId: string) => {
        Alert.alert(
            "Delete Poll",
            "Are you sure you want to delete this poll? This will also remove all votes. This action cannot be undone.",
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.from('poll_questions').delete().eq('id', pollId);
                            if (error) throw error;
                            setPolls(prev => prev.filter(p => p.id !== pollId));
                            refetch(); // Ensure React Query drops the deleted poll cache
                            Alert.alert(t('common.success'), "Poll deleted successfully");
                        } catch (error) {
                            Alert.alert(t('common.error'), "Failed to delete poll");
                        }
                    }
                }
            ]
        );
    }, []);

    const renderPollItem = useCallback(({ item }: { item: any }) => {
        const { PollCard } = require('../components/Polls/PollCard');
        const { PollOptionRadio } = require('../components/Polls/PollOptionRadio');
        const { PollResultBar } = require('../components/Polls/PollResultBar');

        const hasVoted = !!item.my_vote;
        const totalVotes = item.results?.reduce((sum: number, r: any) => sum + r.vote_count, 0) || 1;

        return (
            <PollCard
                poll={item}
                canDelete={isAdmin || userRole === 'moderator'}
                onDelete={handleDeletePoll}
            >
                {item.options?.map((option: any) => {
                    if (hasVoted) {
                        const result = item.results?.find((r: any) => r.option_id === option.id);
                        return (
                            <PollResultBar
                                key={option.id}
                                option={option}
                                result={result}
                                isMyVote={item.my_vote === option.id}
                                totalVotes={totalVotes}
                            />
                        );
                    }
                    return (
                        <PollOptionRadio
                            key={option.id}
                            option={option}
                            onVote={(optId: string) => handleVoteList(item.id, optId)}
                            isVoting={votingPollId === item.id}
                            selectedOptionId={null}
                        />
                    );
                })}
            </PollCard>
        );
    }, [user, votingPollId]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.card }]}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('events.title')}</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.icon }]}>{t('events.subtitle')}</Text>
                </View>

                {/* Segmented Control */}
                <View style={[styles.segmentContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <View style={[styles.segmentWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}>
                        {(['events', 'news', 'polls', 'directory'] as const).map((mode) => {
                            const getSegmentColor = (m: string) => {
                                switch (m) {
                                    case 'events': return '#8B5CF6';
                                    case 'news': return '#3B82F6';
                                    case 'polls': return '#F59E0B';
                                    case 'directory': return '#10B981';
                                    default: return colors.primary;
                                }
                            };
                            const activeColor = getSegmentColor(mode);
                            return (
                                <View
                                    key={mode}
                                    style={[
                                        styles.segmentBtn,
                                        viewMode === mode && [styles.segmentBtnActive, { backgroundColor: isDark ? colors.card : '#FFF', shadowColor: colors.shadow }]
                                    ]}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        viewMode === mode ? [styles.segmentTextActive, { color: activeColor }] : { color: colors.icon }
                                    ]}>
                                        {t(`content.${mode}`)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                    {viewMode === 'events' && (
                        <>
                            <EventCardSkeleton />
                            <EventCardSkeleton />
                        </>
                    )}
                    {viewMode === 'news' && (
                        <>
                            <NewsRowSkeleton />
                            <NewsRowSkeleton />
                            <NewsRowSkeleton />
                        </>
                    )}
                    {viewMode === 'polls' && (
                        <>
                            <PollCardSkeleton />
                            <PollCardSkeleton />
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('events.title')}</Text>
                <Text style={[styles.headerSubtitle, { color: colors.icon }]}>{t('events.subtitle')}</Text>
            </View>

            {/* Segmented Control */}
            <View style={[styles.segmentContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={[styles.segmentWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}>
                    {(['events', 'news', 'polls', 'directory'] as const).map((mode) => {
                        const getSegmentColor = (m: string) => {
                            switch (m) {
                                case 'events': return '#8B5CF6'; // Purple
                                case 'news': return '#3B82F6';   // Blue
                                case 'polls': return '#F59E0B';  // Amber
                                case 'directory': return '#10B981'; // Teal
                                default: return colors.primary;
                            }
                        };
                        const activeColor = getSegmentColor(mode);

                        return (
                            <TouchableOpacity
                                key={mode}
                                style={[
                                    styles.segmentBtn,
                                    viewMode === mode && [styles.segmentBtnActive, { backgroundColor: isDark ? colors.card : '#FFF', shadowColor: colors.shadow }]
                                ]}
                                onPress={() => { lightImpact(); setViewMode(mode as any); }}
                            >
                                <Text style={[
                                    styles.segmentText,
                                    viewMode === mode ? [styles.segmentTextActive, { color: activeColor }] : { color: colors.icon }
                                ]}>
                                    {t(`content.${mode}`)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Content List */}
            <FlatList
                data={viewMode === 'events' ? events : viewMode === 'news' ? news : viewMode === 'directory' ? [{ name: 'State', code: 'STATE' }, ...DISTRICTS] : polls}
                renderItem={
                    viewMode === 'events' ? renderEventItem :
                        viewMode === 'news' ? renderNewsItem :
                            viewMode === 'directory' ? renderDirectoryItem :
                                renderPollItem
                }
                keyExtractor={(item: any) => item.id || item.code}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    <View style={{ height: 100 }}>
                        {loading && <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginTop: 20 }} />}
                    </View>
                }
                ListEmptyComponent={
                    !loading ? <Text style={styles.emptyText}>{t('common.noneFound')}</Text> : null
                }
                initialNumToRender={10}
                windowSize={5}
                maxToRenderPerBatch={5}
                removeClippedSubviews={Platform.OS === 'android'}
            />



            {/* Registration Modal */}
            {registrationModalVisible && (
                <View style={styles.modalOverlay}>
                    <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        {registrationStep === 'form' ? (
                            <>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('events.register')}</Text>
                                <Text style={[styles.modalSubtitle, { color: colors.primary }]}>{selectedEvent?.title}</Text>
                                <Text style={[styles.modalText, { color: colors.icon }]}>{t('events.confirmDetails')}</Text>

                                <View style={styles.inputContainer}>
                                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t('events.fullName')}</Text>
                                    <TextInput
                                        style={[styles.input, styles.disabledInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                        value={registrantName}
                                        editable={false}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t('events.email')}</Text>
                                    <TextInput
                                        style={[styles.input, styles.disabledInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                        value={registrantEmail}
                                        editable={false}
                                    />
                                </View>

                                <TouchableOpacity style={styles.confirmBtn} onPress={confirmRegistration}>
                                    <LinearGradient
                                        colors={Colors.gradients.button}
                                        style={styles.gradientBtn}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.confirmBtnText}>{t('events.confirmReg')}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelBtn} onPress={closeRegistration}>
                                    <Text style={[styles.cancelBtnText, { color: colors.icon }]}>{t('common.cancel')}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.successContainer}>
                                <View style={styles.successIconCircle}>
                                    <Check size={40} color="#FFF" />
                                </View>
                                <Text style={[styles.successTitle, { color: colors.text }]}>{t('events.regSuccess')}</Text>
                                <Text style={[styles.successText, { color: colors.icon }]}>{t('events.regSuccessDesc')}</Text>

                                <TouchableOpacity style={styles.backBtn} onPress={closeRegistration}>
                                    <Text style={styles.backBtnText}>{t('events.backToEvents')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
});
export default EventsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.light.icon,
        marginTop: 4,
    },
    segmentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    segmentWrapper: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    segmentBtnActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    segmentTextActive: {
        color: Colors.light.primary,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#999',
    },
    // Event Card
    cardContainer: {
        marginBottom: 24,
    },
    cardGradientBorder: {
        borderRadius: 22,
        padding: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: 180,
    },
    dateBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
    },
    dateText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 12,
    },
    deleteBtn: {
        position: 'absolute',
        top: 15,
        left: 15,
        borderRadius: 8,
        overflow: 'hidden',
        zIndex: 10,
    },
    deleteBtnBlur: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 8,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    cardMetaText: {
        color: Colors.light.icon,
        fontSize: 14,
    },
    cardDescription: {
        color: '#64748B',
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4,
        marginBottom: 16,
    },
    actionBtn: {
        backgroundColor: Colors.light.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    actionBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    registeredBtn: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    registeredBtnText: {
        color: '#10B981',
    },
    // News Card
    newsCardContainer: {
        marginBottom: 20,
    },
    newsGradientBorder: {
        borderRadius: 22,
        padding: 2, // Reduced from 3 to 2
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    newsCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 19, // Slightly less than border radius - padding
        padding: 12,
        gap: 16,
        alignItems: 'center',
    },
    newsDeleteBtn: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        zIndex: 10,
        borderRadius: 20,
        padding: 8, // Increased padding
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    newsImageContainer: {
        position: 'relative',
        width: 100,
        height: 100,
        borderRadius: 14,
        overflow: 'hidden',
    },
    newsImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F1F5F9',
    },
    newsContent: {
        flex: 1,
        minHeight: 100,
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    newsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
        lineHeight: 22,
    },
    newsInlineDateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    newsSummary: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 8,
    },
    readMoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    readMoreText: {
        fontSize: 12,
        fontWeight: '700',
    },
    // Gallery Card
    galleryCard: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        height: 200,
        backgroundColor: '#000',
    },
    galleryDeleteBtn: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 10,
        borderRadius: 8,
        overflow: 'hidden',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    galleryOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    galleryTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    galleryDate: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    photoCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    photoCountText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        borderRadius: 30,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 16,
        color: Colors.light.primary,
        marginBottom: 12,
        fontWeight: '600',
    },
    modalText: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontSize: 15,
        color: Colors.light.text,
    },
    disabledInput: {
        backgroundColor: '#F1F5F9',
        color: '#64748B',
    },
    confirmBtn: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientBtn: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelBtn: {
        marginTop: 12,
        alignItems: 'center',
        padding: 10,
    },
    cancelBtnText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    successIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 8,
    },
    successText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    backBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
    },
    backBtnText: {
        color: Colors.light.text,
        fontWeight: '600',
        fontSize: 14,
    },
    directoryCard: {
        borderRadius: 16,
        marginBottom: 12,
        padding: 16,
        marginHorizontal: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    directoryCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    directoryIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    directoryTextContainer: {
        flex: 1,
    },
    directoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    directorySubtitle: {
        fontSize: 13,
    },
});
