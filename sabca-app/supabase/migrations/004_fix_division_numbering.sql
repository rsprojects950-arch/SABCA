-- =============================================================================
-- FINAL FIX: SABCA ID Format (District-Type-Seq)
-- Format: SABCA-{DistrictCode}-{MembershipType}-{Sequence}
-- GM: 101+, LM: 1001+, AM: 2001+
-- =============================================================================

-- 1. Temporarily drop Foreign Key constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_division_id_fkey;
ALTER TABLE public.grievances DROP CONSTRAINT IF EXISTS grievances_division_id_fkey;

-- 2. Clean up and Re-initialize Divisions Table with CODES
TRUNCATE TABLE public.divisions RESTART IDENTITY;

-- 3. Add 'code' column if forgotten (should be there if already run, but let's be safe)
ALTER TABLE public.divisions ADD COLUMN IF NOT EXISTS code TEXT;

-- 4. Insert all 16 Districts + Head Office with their correct codes
INSERT INTO public.divisions (id, name, code, member_count)
VALUES
  (0, 'SABCA State Office', 'HO', 0),
  (1, 'Tirupati (SABCA-TPT)', 'TPT', 0),
  (2, 'Ananthapuramu (SABCA-CWA-ATP)', 'CWA-ATP', 0),
  (3, 'Kurnool (SABCA-KNL)', 'KNL', 0),
  (4, 'Nellore (SABCA-NLR)', 'NLR', 0),
  (5, 'Guntur Prakasam (SABCA-SGP)', 'SGP', 0),
  (6, 'Krishna (SABCA-KRN)', 'KRN', 0),
  (7, 'Gunturu Nagarapalaka (SABCA-GNSA)', 'GNSA', 0),
  (8, 'Eluru West Godavari (SABCA-ELWG)', 'ELWG', 0),
  (9, 'East Godavari (SABCA-EGD)', 'EGD', 0),
  (10, 'Kakinada & Konaseema (SABCA-KKD)', 'KKD', 0),
  (11, 'Visakha (SABCA-VSP)', 'VSP', 0),
  (12, 'Greater Visakha (SABCA-GVMC)', 'GVMC-CWA', 0),
  (13, 'Vizianagaram (SABCA-RCA-VZM)', 'RCA-VZM', 0),
  (14, 'Srikakulam (SABCA-SKLM)', 'SKLM', 0),
  (15, 'Vizianagaram Municipal (SABCA-VZM-CWA)', 'VZM-CWA', 0),
  (16, 'Mangalagiri Tadepalli (SABCA-MTMC)', 'MTMC', 0);

-- Restore sequence for divisions (next id will be 17)
SELECT setval('divisions_id_seq', 16, true);

-- 5. Sync profiles.division_id and Auto-assign Admins to Head Office
UPDATE public.profiles
SET division = 'SABCA State Office',
    division_id = 0
WHERE role IN ('admin', 'moderator', 'super_admin');

UPDATE public.profiles
SET division_id = d.id
FROM public.divisions d
WHERE public.profiles.division = d.name
AND role NOT IN ('admin', 'moderator', 'super_admin');

-- 6. Rewrite the generate_membership_id function to follow the "One and Only" format
CREATE OR REPLACE FUNCTION generate_membership_id() 
RETURNS TRIGGER AS $$
DECLARE
    div_code TEXT;
    type_code TEXT;
    start_seq INT;
    next_seq INT;
    new_id_str TEXT;
BEGIN
    -- Force Division for Admins/Moderators
    IF NEW.role IN ('admin', 'moderator', 'super_admin') THEN
        NEW.division := 'SABCA State Office';
    END IF;

    -- Skip if Division is missing or sabca_id is already set manually
    IF NEW.division IS NULL OR (NEW.sabca_id IS NOT NULL AND NEW.sabca_id LIKE 'SABCA-%') THEN
        RETURN NEW;
    END IF;

    -- A. Determine District Code
    SELECT code INTO div_code FROM public.divisions WHERE name = NEW.division;
    IF div_code IS NULL THEN div_code := 'HO'; END IF;

    -- B. Determine Role/Membership Type and Start Sequence
    -- SPECIAL ROLES (Optional: override district format if you want SABCA-HO-ADM-001)
    -- But since user says "one and only format", we will use the district-based one unless specified.
    
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
    -- Pattern: SABCA-{Code}-{Type}-
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

-- 7. Reset all IDs to NULL to force regeneration if they don't match the new format
UPDATE public.profiles
SET sabca_id = NULL, membership_id = NULL
WHERE sabca_id IS NOT NULL 
AND NOT (
    sabca_id LIKE 'SABCA-%-GM-%' OR 
    sabca_id LIKE 'SABCA-%-LM-%' OR 
    sabca_id LIKE 'SABCA-%-AM-%'
);

-- 8. Trigger regeneration for all Active members without an ID
UPDATE public.profiles
SET division = division
WHERE (sabca_id IS NULL OR sabca_id = '') 
AND division IS NOT NULL 
AND (is_paid_member = TRUE OR role IN ('admin', 'moderator', 'super_admin'));

-- 9. Restore Foreign Keys and re-sync counts
UPDATE public.grievances g
SET division_id = COALESCE(p.division_id, 0)
FROM public.profiles p
WHERE g.user_id = p.id;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_division_id_fkey 
FOREIGN KEY (division_id) REFERENCES public.divisions(id) ON DELETE SET NULL;

ALTER TABLE public.grievances 
ADD CONSTRAINT grievances_division_id_fkey 
FOREIGN KEY (division_id) REFERENCES public.divisions(id) ON DELETE SET NULL;

UPDATE public.divisions d
SET member_count = (
    SELECT COUNT(*) 
    FROM public.profiles p 
    WHERE p.division = d.name
);
