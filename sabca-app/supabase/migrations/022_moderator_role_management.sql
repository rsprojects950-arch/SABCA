-- Migration 022: Moderator Role Management
-- This defines/updates the set_user_role function and ensures moderators can use it

CREATE OR REPLACE FUNCTION set_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS JSONB AS $$
DECLARE
    executor_role TEXT;
BEGIN
    -- Check permissions
    SELECT role INTO executor_role FROM public.profiles WHERE id = auth.uid();
    
    -- Admin can do anything
    -- Moderator can promote to 'moderator' or demote to 'member'
    IF executor_role = 'admin' THEN
        -- Allow admin to set any valid role
        IF new_role NOT IN ('admin', 'moderator', 'member') THEN
            RAISE EXCEPTION 'Invalid role: %', new_role;
        END IF;
    ELSIF executor_role = 'moderator' THEN
        -- Moderator can only set roles to 'moderator' or 'member'
        IF new_role NOT IN ('moderator', 'member') THEN
            RAISE EXCEPTION 'Access Denied: Moderators can only promote/demote between moderator and member roles.';
        END IF;
    ELSE
        RAISE EXCEPTION 'Access Denied: Only Admins and Moderators can manage roles.';
    END IF;

    -- Update Profile
    UPDATE public.profiles
    SET 
        role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_role', new_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user designation
CREATE OR REPLACE FUNCTION set_user_designation(
    target_user_id UUID,
    new_designation TEXT
)
RETURNS JSONB AS $$
DECLARE
    executor_role TEXT;
BEGIN
    -- Check permissions
    SELECT role INTO executor_role FROM public.profiles WHERE id = auth.uid();
    
    IF executor_role NOT IN ('admin', 'moderator') THEN
        RAISE EXCEPTION 'Access Denied: Only Admins and Moderators can manage designations.';
    END IF;

    -- Update Profile
    UPDATE public.profiles
    SET 
        designation = new_designation,
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_designation', new_designation
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
