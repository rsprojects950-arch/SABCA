-- 0. Clean up Corpus Table (Requested by user)
DROP TABLE IF EXISTS public.corpus_contributions;

-- 2. Create or Replace approve_membership
-- Drop first to allow return type change (void -> jsonb)
DROP FUNCTION IF EXISTS approve_membership(uuid,text,text,text,text,timestamp with time zone,numeric,text);

CREATE OR REPLACE FUNCTION approve_membership(
    target_user_id UUID,
    district_code TEXT,
    district_name TEXT,
    membership_type_code TEXT,
    membership_type_label TEXT,
    validity_date TIMESTAMPTZ,
    payment_amount NUMERIC DEFAULT 0,
    payment_method TEXT DEFAULT 'Cash'
)
RETURNS JSONB AS $$
DECLARE
    new_sabca_id TEXT;
    current_role TEXT;
    current_sabca_id TEXT;
    executor_role TEXT;
BEGIN
    -- Check permissions
    SELECT role INTO executor_role FROM public.profiles WHERE id = auth.uid();
    IF executor_role NOT IN ('admin') THEN
        RAISE EXCEPTION 'Access Denied: Only Admins can approve memberships.';
    END IF;

    -- 1. Check current role and existing SABCA ID
    SELECT role, sabca_id INTO current_role, current_sabca_id FROM profiles WHERE id = target_user_id;

    -- 2. Handle Admin/Moderator special IDs
    IF current_role = 'admin' THEN
        -- Find next admin sequence
        SELECT 'SABCA-ADM-' || LPAD((COALESCE(MAX(CAST(SUBSTRING(sabca_id FROM 11) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
        INTO new_sabca_id
        FROM profiles
        WHERE role = 'admin' AND sabca_id LIKE 'SABCA-ADM-%';
        
        -- If they already have a special ADM ID, keep it
        IF current_sabca_id LIKE 'SABCA-ADM-%' THEN
          new_sabca_id := current_sabca_id;
        END IF;

    ELSIF current_role = 'moderator' THEN
        -- Find next moderator sequence
        SELECT 'SABCA-MOD-' || LPAD((COALESCE(MAX(CAST(SUBSTRING(sabca_id FROM 11) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
        INTO new_sabca_id
        FROM profiles
        WHERE role = 'moderator' AND sabca_id LIKE 'SABCA-MOD-%';

        -- If they already have a special MOD ID, keep it
        IF current_sabca_id LIKE 'SABCA-MOD-%' THEN
          new_sabca_id := current_sabca_id;
        END IF;

    ELSE
        -- 3. Regular Member Logic (District-Type-Seq)
        -- Pattern: SABCA-{district}-{type}-{number}
        -- We use the start sequences from fix_division_numbering logic
        DECLARE
             id_prefix TEXT;
             start_seq INTEGER;
             next_seq INTEGER;
        BEGIN
             id_prefix := 'SABCA-' || district_code || '-' || membership_type_code || '-';
             
             -- Check if current ID matches the new prefix
             IF current_sabca_id IS NOT NULL AND current_sabca_id LIKE id_prefix || '%' THEN
                new_sabca_id := current_sabca_id;
             ELSE
                -- Define Start Sequences
                IF membership_type_code = 'AM' THEN start_seq := 2001;
                ELSIF membership_type_code = 'LM' THEN start_seq := 1001;
                ELSIF membership_type_code = 'GM' THEN start_seq := 101;
                ELSE start_seq := 1; END IF;

                -- Find Max
                SELECT COALESCE(MAX(CAST(SUBSTRING(sabca_id FROM LENGTH(id_prefix) + 1) AS INTEGER)), start_seq - 1) + 1
                INTO next_seq
                FROM public.profiles
                WHERE sabca_id LIKE id_prefix || '%';

                new_sabca_id := id_prefix || next_seq;
             END IF;
        END;
    END IF;

    -- 4. Update Profile
    UPDATE public.profiles
    SET 
        sabca_id = new_sabca_id,
        division = district_name,
        membership_type = membership_type_label,
        membership_expiry = validity_date,
        is_paid_member = TRUE,
        status = 'Active',
        updated_at = NOW()
    WHERE id = target_user_id;

    -- NOTE: Payment recording to 'corpus_contributions' has been removed as per request.

    RETURN jsonb_build_object(
        'success', true,
        'sabca_id', new_sabca_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
