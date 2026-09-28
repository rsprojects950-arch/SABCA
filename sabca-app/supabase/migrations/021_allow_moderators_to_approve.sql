-- Migration 021: Allow Moderators to approve membership
-- This updates the approve_membership RPC to include 'moderator' in the authorized roles

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
    executor_role TEXT;
    current_sabca_id TEXT;
    new_txn_ref TEXT;
    txn_type TEXT;
    txn_description TEXT;
    formatted_amount TEXT;
BEGIN
    -- Check permissions: Allow both admin AND moderator
    SELECT role INTO executor_role FROM public.profiles WHERE id = auth.uid();
    IF executor_role NOT IN ('admin', 'moderator') THEN
        RAISE EXCEPTION 'Access Denied: Only Admins and Moderators can approve memberships.';
    END IF;

    -- 1. Check current role and existing SABCA ID
    SELECT role, sabca_id INTO current_role, current_sabca_id FROM profiles WHERE id = target_user_id;

    -- 2. Handle Admin/Moderator special IDs
    IF current_role = 'admin' THEN
        SELECT 'SABCA-ADM-' || LPAD((COALESCE(MAX(CAST(SUBSTRING(sabca_id FROM 11) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
        INTO new_sabca_id
        FROM profiles
        WHERE role = 'admin' AND sabca_id LIKE 'SABCA-ADM-%';
        
        IF current_sabca_id LIKE 'SABCA-ADM-%' THEN
          new_sabca_id := current_sabca_id;
        END IF;

    ELSIF current_role = 'moderator' THEN
        SELECT 'SABCA-MOD-' || LPAD((COALESCE(MAX(CAST(SUBSTRING(sabca_id FROM 11) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
        INTO new_sabca_id
        FROM profiles
        WHERE role = 'moderator' AND sabca_id LIKE 'SABCA-MOD-%';

        IF current_sabca_id LIKE 'SABCA-MOD-%' THEN
          new_sabca_id := current_sabca_id;
        END IF;

    ELSE
        -- 3. Regular Member Logic
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

                -- Find Max using regex substring to safely extract only the trailing number
                SELECT COALESCE(
                    MAX(
                        CAST(
                            SUBSTRING(sabca_id FROM '([0-9]+)$')
                        AS INTEGER)
                    ), 
                    start_seq - 1
                ) + 1
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

    -- 5. Record Transaction
    -- Generate unique transaction reference
    new_txn_ref := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8));
    
    -- Determine transaction type
    IF membership_type_code = 'LM' THEN
        txn_type := 'Life Membership';
    ELSIF membership_type_code = 'GM' THEN
        txn_type := 'Global Membership';
    ELSE
        txn_type := 'Annual Membership';
    END IF;
    
    -- Format amount for display
    formatted_amount := '₹' || TO_CHAR(payment_amount, 'FM999,999');
    txn_description := txn_type || ' - ' || district_name;
    
    -- Insert transaction record
    INSERT INTO public.transactions (
        user_id,
        txn_ref,
        type,
        description,
        amount,
        payment_method,
        status,
        date
    ) VALUES (
        target_user_id,
        new_txn_ref,
        txn_type,
        txn_description,
        formatted_amount,
        payment_method,
        'Success',
        NOW()
    );

    -- 6. Return success with both IDs
    RETURN jsonb_build_object(
        'success', true,
        'sabca_id', new_sabca_id,
        'transaction_id', new_txn_ref
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
