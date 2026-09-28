-- Migration to implement special IDs for Admin and Moderator roles
-- Format: SABCA-ADM-XXX and SABCA-MOD-XXX

-- 1. Update existing Admins sequentially
DO $$
DECLARE
    r RECORD;
    i INT := 1;
BEGIN
    FOR r IN (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at ASC) LOOP
        UPDATE public.profiles 
        SET sabca_id = 'SABCA-ADM-' || LPAD(i::TEXT, 3, '0')
        WHERE id = r.id;
        i := i + 1;
    END LOOP;
END $$;

-- 2. Update existing Moderators sequentially
DO $$
DECLARE
    r RECORD;
    i INT := 1;
BEGIN
    FOR r IN (SELECT id FROM public.profiles WHERE role = 'moderator' ORDER BY created_at ASC) LOOP
        UPDATE public.profiles 
        SET sabca_id = 'SABCA-MOD-' || LPAD(i::TEXT, 3, '0')
        WHERE id = r.id;
        i := i + 1;
    END LOOP;
END $$;

-- 3. Update the approve_membership function to handle special IDs for leadership
CREATE OR REPLACE FUNCTION approve_membership(
  target_user_id UUID,
  district_code TEXT,
  district_name TEXT,
  membership_type_code TEXT, -- 'AM', 'LM', 'GM'
  membership_type_label TEXT, -- 'Annual', 'Life', 'Global'
  validity_date TIMESTAMP WITH TIME ZONE
) RETURNS JSON AS $$
DECLARE
  id_prefix TEXT;
  start_seq INTEGER;
  next_seq INTEGER;
  new_sabca_id TEXT;
  current_role TEXT;
  current_sabca_id TEXT;
BEGIN
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
    -- 3. Regular Member Logic
    -- Pattern: SABCA-{district}-{type}-{number}
    id_prefix := 'SABCA-' || district_code || '-' || membership_type_code || '-';
    
    -- Check if current ID matches the new prefix
    IF current_sabca_id IS NOT NULL AND current_sabca_id LIKE id_prefix || '%' THEN
      new_sabca_id := current_sabca_id;
    ELSE
      -- Generate New Regular ID
      IF membership_type_code = 'AM' THEN
        start_seq := 2001;
      ELSIF membership_type_code = 'LM' THEN
        start_seq := 1001;
      ELSIF membership_type_code = 'GM' THEN
        start_seq := 101;
      ELSE
        RAISE EXCEPTION 'Invalid membership type code';
      END IF;

      SELECT COALESCE(MAX(CAST(SUBSTRING(sabca_id FROM LENGTH(id_prefix) + 1) AS INTEGER)), start_seq - 1) + 1
      INTO next_seq
      FROM profiles
      WHERE sabca_id LIKE id_prefix || '%';

      new_sabca_id := id_prefix || next_seq;
    END IF;
  END IF;

  -- 4. Update the profile
  UPDATE profiles
  SET 
    sabca_id = new_sabca_id,
    division = district_name,
    membership_type = membership_type_label,
    is_paid_member = true,
    membership_expiry = validity_date,
    status = 'Active',
    updated_at = NOW()
  WHERE id = target_user_id;

  RETURN json_build_object(
    'success', true,
    'sabca_id', new_sabca_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
