import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

// 1. Network Status Hook
export const checkNetworkConnection = async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    return state.isConnected === true && (state.isInternetReachable === true || state.isInternetReachable === null); // assume reachable if null (unknown) or restrict? 
    // Usually isInternetReachable is null initially. 
    // Better safely: return !!state.isConnected && !!state.isInternetReachable;
    // But let's stick to simple:
    return !!state.isConnected && (state.isInternetReachable ?? false);
};

// 2. Retry Logic Wrapper
export const retryOperation = async <T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 1000
): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        if (retries <= 0) throw error;

        console.log(`Operation failed, retrying in ${delayMs}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delayMs));

        return retryOperation(operation, retries - 1, delayMs * 2); // Exponential backoff
    }
};

// 3. Duplicate Grievance Detection
export const checkDuplicateGrievance = async (userId: string, title: string): Promise<boolean> => {
    if (!userId || !title) return false;

    // Check for grievances with SAME title from SAME user in last 24 hours (or just existing open ones)
    // Let's check for any OPEN grievance with similar title
    const { data, error } = await supabase
        .from('grievances')
        .select('id')
        .eq('user_id', userId)
        .ilike('title', title.trim()) // Case insensitive exact match or close enough
        .neq('status', 'Resolved')
        .neq('status', 'Rejected');

    if (error) {
        console.error("Duplicate check error:", error);
        return false;
    }

    return data && data.length > 0;
};
