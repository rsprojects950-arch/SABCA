-- Migration 045: User Self Deletion RPC
-- Allows authenticated users to safely and permanently delete their own account and all associated data.

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Identify currently authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated: Cannot delete account without an active session.';
    END IF;

    -- 2. Clean up relational application data (notifications, transactions, documents, grievances, polls, profile)
    PERFORM public.delete_user_data_cascade(v_user_id);

    -- 3. Delete from auth.users to purge credentials and authentication tokens
    DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
