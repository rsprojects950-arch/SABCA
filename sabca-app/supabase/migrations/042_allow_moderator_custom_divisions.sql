-- Update generate_membership_id to NOT override division for admins/moderators
CREATE OR REPLACE FUNCTION generate_membership_id() 
RETURNS TRIGGER AS $$
DECLARE
    div_code TEXT;
    type_code TEXT;
    start_seq INT;
    next_seq INT;
    new_id_str TEXT;
BEGIN
    -- REMOVED: Force Division for Admins/Moderators
    -- IF NEW.role IN ('admin', 'moderator', 'super_admin') THEN
    --     NEW.division := 'SABCA State Office';
    -- END IF;

    -- Skip if Division is missing or sabca_id is already set manually
    IF NEW.division IS NULL OR (NEW.sabca_id IS NOT NULL AND NEW.sabca_id LIKE 'SABCA-%') THEN
        RETURN NEW;
    END IF;

    -- A. Determine District Code
    SELECT code INTO div_code FROM public.divisions WHERE name = NEW.division;
    IF div_code IS NULL THEN div_code := 'HO'; END IF;

    -- B. Determine Role/Membership Type and Start Sequence
    IF NEW.membership_type = 'Global' THEN
        type_code := 'GM';
        start_seq := 101;
    ELSIF NEW.membership_type = 'Life' THEN
        type_code := 'LM';
        start_seq := 1001;
    ELSIF NEW.membership_type = 'Annual' OR NEW.membership_type IS NULL THEN
        type_code := 'AM';
        start_seq := 2001;
    END IF;

    -- C. Calculate Next Sequence for this SPECIFIC Prefix
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(sabca_id FROM (LENGTH('SABCA-' || div_code || '-' || type_code || '-') + 1)) AS INTEGER)),
        start_seq - 1
    ) + 1
    INTO next_seq
    FROM public.profiles
    WHERE sabca_id LIKE 'SABCA-' || div_code || '-' || type_code || '-%';

    -- D. Construct Final ID
    new_id_str := 'SABCA-' || div_code || '-' || type_code || '-' || next_seq::TEXT;
    
    NEW.sabca_id := new_id_str;
    NEW.membership_id := new_id_str; -- For backward compatibility
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
