import { supabase } from '../../lib/supabase';

// Types
export interface PollOption {
    id: string;
    poll_id: string;
    option_text: string;
    order_index: number;
}

export interface PollQuestion {
    id: string;
    question: string;
    created_by: string;
    created_at: string;
    expires_at?: string;
    status: 'active' | 'closed';
    target_audience: 'all' | 'specific_division';
    target_division?: string | null;
    options?: PollOption[];
    my_vote?: string | null; // The option_id the current user voted for
    total_votes?: number;
}

export interface PollResult {
    option_id: string;
    vote_count: number;
    percentage: number;
}

// 1. Fetch the single latest active poll for the Home Screen
export const fetchActivePoll = async (userId: string): Promise<PollQuestion | null> => {
    try {
        let isAdmin = false;
        let profile = null;

        if (userId) {
            const { data } = await supabase.from('profiles').select('role, membership_type, division').eq('id', userId).maybeSingle();
            profile = data;
            isAdmin = profile?.role === 'admin' || profile?.role === 'moderator';
        }

        let query = supabase
            .from('poll_questions')
            .select('*, options:poll_options(*)')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (!isAdmin) {
            let orCondition = 'target_audience.eq.all';
            // Use double quotes for division name to handle special characters like ()
            if (profile?.division) orCondition += `,target_division.eq."${profile.division}"`;
            query = query.or(orCondition);
        }

        const { data: polls, error } = await query.limit(1);
        const poll = polls?.[0];

        if (error || !poll) {
            if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error
                console.error('Error fetching active poll:', error);
            }
            return null;
        }

        // Sort options by order_index
        if (poll.options) {
            poll.options.sort((a: PollOption, b: PollOption) => a.order_index - b.order_index);
        }

        // Check if the current user has already voted on this poll
        const { data: vote } = await supabase
            .from('poll_votes')
            .select('option_id')
            .eq('poll_id', poll.id)
            .eq('user_id', userId)
            .maybeSingle();

        return {
            ...poll,
            my_vote: vote?.option_id || null
        };

    } catch (err) {
        console.error('Exception fetching active poll:', err);
        return null;
    }
};

// 2. Cast a vote
export const submitVote = async (pollId: string, optionId: string, userId: string): Promise<{ success: boolean, error?: string }> => {
    try {
        const { error } = await supabase
            .from('poll_votes')
            .insert([
                { poll_id: pollId, option_id: optionId, user_id: userId }
            ]);

        if (error) {
            if (error.code === '23505') { // Postgres UNIQUE constraint violation code
                return { success: false, error: 'You have already voted on this poll.' };
            }
            console.error('Error submitting vote:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Exception submitting vote:', err);
        return { success: false, error: err.message };
    }
};

// 3. Get results for a specific poll (used when a user has already voted or poll is closed)
export const fetchPollResults = async (pollId: string): Promise<PollResult[]> => {
    try {
        // Fetch all votes for this poll
        const { data: votes, error } = await supabase
            .from('poll_votes')
            .select('option_id')
            .eq('poll_id', pollId);

        if (error) {
            console.error('Error fetching poll results:', error);
            return [];
        }

        const totalVotes = votes.length;
        if (totalVotes === 0) return [];

        // Tally the votes
        const counts: Record<string, number> = {};
        votes.forEach((vote: { option_id: string }) => {
            counts[vote.option_id] = (counts[vote.option_id] || 0) + 1;
        });

        // Convert to array with percentages
        return Object.entries(counts).map(([option_id, vote_count]) => ({
            option_id,
            vote_count,
            percentage: Math.round((vote_count / totalVotes) * 100)
        }));

    } catch (err) {
        console.error('Exception fetching poll results:', err);
        return [];
    }
};

// 4. Fetch all polls for the Archive (Events Tab)
export const fetchAllPolls = async (userId: string): Promise<PollQuestion[]> => {
    try {
        let isAdmin = false;
        let profile = null;

        if (userId) {
            const { data } = await supabase.from('profiles').select('role, membership_type, division').eq('id', userId).maybeSingle();
            profile = data;
            isAdmin = profile?.role === 'admin' || profile?.role === 'moderator';
        }

        let query = supabase
            .from('poll_questions')
            .select('*, options:poll_options(*)')
            .order('created_at', { ascending: false });

        if (!isAdmin) {
            let orCondition = 'target_audience.eq.all';
            if (profile?.division) orCondition += `,target_division.eq."${profile.division}"`;
            query = query.or(orCondition);
        }

        const { data: polls, error } = await query;

        if (error) {
            console.error('Error fetching all polls:', error);
            return [];
        }

        // Sort options for each poll
        polls.forEach((p: PollQuestion) => {
            if (p.options) p.options.sort((a: PollOption, b: PollOption) => a.order_index - b.order_index);
        });

        // In a real production app with massive scale, you would do a single joined query here, 
        // but for this scale, fetching votes is fine to calculate aggregated percentages.
        const { data: allVotes } = await supabase
            .from('poll_votes')
            .select('poll_id, option_id, user_id');

        const voteMap = new Map();
        const pollCountsMap = new Map();

        allVotes?.forEach((v: { poll_id: string, option_id: string, user_id: string }) => {
            // Track user's own votes
            if (v.user_id === userId) {
                voteMap.set(v.poll_id, v.option_id);
            }

            // Box counting for results
            if (!pollCountsMap.has(v.poll_id)) {
                pollCountsMap.set(v.poll_id, { total: 0, options: {} });
            }
            const pollData = pollCountsMap.get(v.poll_id);
            pollData.total += 1;
            pollData.options[v.option_id] = (pollData.options[v.option_id] || 0) + 1;
        });

        return polls.map((poll: PollQuestion) => {
            // Calculate results percentage if they exist
            let results: PollResult[] = [];
            if (pollCountsMap.has(poll.id)) {
                const pollData = pollCountsMap.get(poll.id);
                results = Object.entries(pollData.options).map(([optId, count]: [string, any]) => ({
                    option_id: optId,
                    vote_count: count,
                    percentage: Math.round((count / pollData.total) * 100)
                }));
            }

            return {
                ...poll,
                my_vote: voteMap.get(poll.id) || null,
                results
            };
        });

    } catch (err) {
        console.error('Exception fetching all polls:', err);
        return [];
    }
};
