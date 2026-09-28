-- Migration 023: Fix Moderator ID Generation
-- This updates set_user_role to automatically assign special IDs (SABCA-MOD-XXX or SABCA-ADM-XXX)

CREATE OR REPLACE FUNCTION set_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS JSONB AS $$
DECLARE
    executor_role TEXT;
    new_sabca_id TEXT;
    current_sabca_id TEXT;
BEGIN
    -- Check permissions
    SELECT role INTO executor_role FROM public.profiles WHERE id = auth.uid();
    
    -- Admin can do anything
    -- Moderator can promote to 'moderator' or demote to 'member'
    IF executor_role = 'admin' THEN
        IF new_role NOT IN ('admin', 'moderator', 'member') THEN
            RAISE EXCEPTION 'Invalid role: %', new_role;
        END IF;
    ELSIF executor_role = 'moderator' THEN
        IF new_role NOT IN ('moderator', 'member') THEN
            RAISE EXCEPTION 'Access Denied: Moderators can only promote/demote between moderator and member roles.';
        END IF;
    ELSE
        RAISE EXCEPTION 'Access Denied: Only Admins and Moderators can manage roles.';
    END IF;

    -- Get current SABCA ID
    SELECT sabca_id INTO current_sabca_id FROM public.profiles WHERE id = target_user_id;

    -- Handle Special ID Generation
    IF new_role = 'admin' THEN
        -- Generate next admin sequence if not already an admin
        IF current_sabca_id IS NULL OR current_sabca_id NOT LIKE 'SABCA-ADM-%' THEN
            SELECT 'SABCA-ADM-' || LPAD((COALESCE(MAX(CAST(SUBSTRING(sabca_id FROM 11) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
            INTO new_sabca_id
            FROM profiles
            WHERE role = 'admin' AND sabca_id LIKE 'SABCA-ADM-%';
        ELSE
            new_sabca_id := current_sabca_id;
        END IF;
    ELSIF new_role = 'moderator' THEN
        -- Generate next moderator sequence if not already a moderator
        IF current_sabca_id IS NULL OR current_sabca_id NOT LIKE 'SABCA-MOD-%' THEN
            SELECT 'SABCA-MOD-' || LPAD((COALESCE(MAX(CAST(SUBSTRING(sabca_id FROM 11) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
            INTO new_sabca_id
            FROM profiles
            WHERE role = 'moderator' AND sabca_id LIKE 'SABCA-MOD-%';
        ELSE
            new_sabca_id := current_sabca_id;
        END IF;
    ELSE
        -- Keep existing ID for 'member' role (or handle reversion if necessary)
        new_sabca_id := current_sabca_id;
    END IF;

    -- Update Profile
    UPDATE public.profiles
    SET 
        role = new_role,
        sabca_id = COALESCE(new_sabca_id, current_sabca_id),
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_role', new_role,
        'new_sabca_id', COALESCE(new_sabca_id, current_sabca_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
