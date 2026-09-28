-- Migration 025: Revoke Membership RPC
-- Allows Admins and Moderators to mark a user as Unpaid

CREATE OR REPLACE FUNCTION revoke_membership(
    target_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    executor_role TEXT;
    executor_division TEXT;
    target_division TEXT;
BEGIN
    -- 1. Check executor permissions
    SELECT role, division INTO executor_role, executor_division 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    IF executor_role NOT IN ('admin', 'moderator') THEN
        RAISE EXCEPTION 'Access Denied: Only Admins and Moderators can revoke memberships.';
    END IF;

    -- 2. If Moderator, check division match
    IF executor_role = 'moderator' THEN
        SELECT division INTO target_division FROM public.profiles WHERE id = target_user_id;
        
        IF target_division IS NULL OR target_division != executor_division THEN
            RAISE EXCEPTION 'Access Denied: Moderators can only revoke memberships within their own division.';
        END IF;
    END IF;

    -- 3. Update Profile
    UPDATE public.profiles
    SET 
        is_paid_member = FALSE,
        status = 'Pending',
        membership_expiry = NULL,
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Membership revoked successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
