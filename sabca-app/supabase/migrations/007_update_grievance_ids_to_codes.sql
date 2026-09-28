-- ==========================================
-- UPDATE: Grievance ID Format to Use Division Codes
-- Format: GRV-{DivisionCode}-{Year}-{Seq}
-- Example: GRV-TPT-2026-0001, GRV-HO-2026-0001
-- ==========================================

-- 1. Update the ID Generation Function to use division codes
CREATE OR REPLACE FUNCTION public.handle_grievance_insert()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_div_id BIGINT;
    div_code TEXT;
    year_str TEXT;
    seq_val BIGINT;
BEGIN
    -- A. Fetch the user's current division ID
    SELECT division_id INTO user_div_id
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Handle case where user has no division (fallback to Head Office)
    IF user_div_id IS NULL THEN
        user_div_id := 0; 
    END IF;

    -- B. Fetch the division code
    SELECT code INTO div_code
    FROM public.divisions
    WHERE id = user_div_id;

    -- Fallback to 'HO' if code not found
    IF div_code IS NULL THEN
        div_code := 'HO';
    END IF;

    -- C. Store the division ID in the grievance record
    NEW.division_id := user_div_id;

    -- D. Generate the Custom ID
    -- Format: GRV-{Code}-{Year}-{Seq}
    -- Examples:
    --   GRV-TPT-2026-0001 (Tirupati)
    --   GRV-HO-2026-0001 (Head Office)
    --   GRV-VSP-2026-0001 (Visakha)
    
    year_str := to_char(now(), 'YYYY');
    seq_val := nextval('public.grievance_id_seq'); -- Reuse existing sequence
    
    NEW.display_id := 'GRV-' || div_code || '-' || year_str || '-' || lpad(seq_val::text, 4, '0');

    RETURN NEW;
END;
$$;

-- 2. Migrate existing grievances to use division codes
-- This updates all existing grievances to the new format

-- First, add a backup column to preserve old IDs (for safety)
ALTER TABLE public.grievances 
ADD COLUMN IF NOT EXISTS old_display_id TEXT;

-- Backup existing IDs
UPDATE public.grievances
SET old_display_id = display_id
WHERE old_display_id IS NULL;

-- Update grievances that have a valid division_id
UPDATE public.grievances g
SET display_id = 'GRV-' || COALESCE(d.code, 'HO') || '-' || 
                 -- Extract year from old ID (e.g., '2026' from 'GRV-1-2026-0001')
                 SUBSTRING(g.display_id FROM 'GRV-\d+-(\d{4})-') || '-' || 
                 -- Extract sequence from old ID (e.g., '0001' from 'GRV-1-2026-0001')
                 SUBSTRING(g.display_id FROM 'GRV-\d+-\d{4}-(\d{4})')
FROM public.divisions d
WHERE g.division_id = d.id
AND g.display_id LIKE 'GRV-%-%-%'
AND g.display_id NOT LIKE 'GRV-%-%-%-%'; -- Don't update if already in new format

-- Handle grievances with NULL division_id (assign to Head Office)
UPDATE public.grievances
SET display_id = 'GRV-HO-' || 
                 SUBSTRING(display_id FROM 'GRV-\d+-(\d{4})-') || '-' || 
                 SUBSTRING(display_id FROM 'GRV-\d+-\d{4}-(\d{4})'),
    division_id = 0
WHERE division_id IS NULL
AND display_id LIKE 'GRV-%-%-%'
AND display_id NOT LIKE 'GRV-%-%-%-%';

-- 3. Verify the migration
-- This query shows before/after comparison
SELECT 
    id,
    old_display_id AS "Old ID",
    display_id AS "New ID",
    division_id,
    (SELECT name FROM public.divisions WHERE id = grievances.division_id) AS "Division Name"
FROM public.grievances
WHERE old_display_id IS NOT NULL
ORDER BY submitted_date DESC
LIMIT 20;

-- 4. Optional: Remove backup column after verification
-- Uncomment this after confirming migration is successful
ALTER TABLE public.grievances DROP COLUMN IF EXISTS old_display_id;


