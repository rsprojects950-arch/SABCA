import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../ctx/AuthContext';
import {
    fetchActivePoll,
    submitVote,
    fetchPollResults,
    PollQuestion,
    PollResult
} from '@/app/services/polls';
import { PollCard } from './PollCard';
import { PollOptionRadio } from './PollOptionRadio';
import { PollResultBar } from './PollResultBar';

export const ActivePollWidget = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [poll, setPoll] = useState<PollQuestion | null>(null);
    const [results, setResults] = useState<PollResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVoting, setIsVoting] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    useEffect(() => {
        loadPoll();
    }, [user]);

    const loadPoll = async () => {
        if (!user) return;

        setIsLoading(true);
        const activePoll = await fetchActivePoll(user.id);
        setPoll(activePoll);

        // If the user has already voted, actively fetch and display the results
        if (activePoll && activePoll.my_vote) {
            const pollResults = await fetchPollResults(activePoll.id);
            setResults(pollResults);
        }

        setIsLoading(false);
    };

    const handleVote = async (optionId: string) => {
        if (!user || !poll) return;

        setSelectedOption(optionId);
        setIsVoting(true);

        const { success, error } = await submitVote(poll.id, optionId, user.id);

        if (success) {
            // Optimistically update the local state to show results immediately
            setPoll({ ...poll, my_vote: optionId });
            const newResults = await fetchPollResults(poll.id);
            setResults(newResults);
        } else {
            Alert.alert('Vote Failed', error || 'Something went wrong. Please try again.');
            setSelectedOption(null);
        }

        setIsVoting(false);
    };

    if (isLoading) {
        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
            </View>
        );
    }

    // If there is no active poll in the database, render nothing
    if (!poll) {
        return null;
    }

    const hasVoted = !!poll.my_vote;
    const totalVotes = results.reduce((sum, r) => sum + r.vote_count, 0) || 1; // Prevent divide by zero

    return (
        <PollCard poll={poll}>
            {poll.options?.map((option) => {

                if (hasVoted) {
                    const result = results.find(r => r.option_id === option.id);
                    return (
                        <PollResultBar
                            key={option.id}
                            option={option}
                            result={result}
                            isMyVote={poll.my_vote === option.id}
                            totalVotes={totalVotes}
                        />
                    );
                }

                return (
                    <PollOptionRadio
                        key={option.id}
                        option={option}
                        onVote={handleVote}
                        isVoting={isVoting}
                        selectedOptionId={selectedOption}
                    />
                );

            })}

            <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
                <TouchableOpacity onPress={() => router.push('/events?view=polls')} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ color: Colors.light.primary, fontSize: 13, fontWeight: '600' }}>
                        View All Polls →
                    </Text>
                </TouchableOpacity>
            </View>
        </PollCard>
    );
};
