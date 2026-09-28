-- Migration 040: Revert Existing Moderator IDs
-- This script finds all users with a SABCA-MOD-XXX ID.
-- It temporarily sets their ID to NULL and updates their record, 
-- which will trigger the standard `generate_sabca_id` function 
-- to generate a regular district-based SABCA ID (e.g., SABCA-HYD-AM-2024).

DO $$
DECLARE
    mod_record RECORD;
BEGIN
    FOR mod_record IN 
        SELECT id, sabca_id, division 
        FROM public.profiles 
        WHERE sabca_id LIKE 'SABCA-MOD-%'
    LOOP
        -- 1. Set the ID to NULL first
        UPDATE public.profiles 
        SET sabca_id = NULL 
        WHERE id = mod_record.id;
        
        -- 2. Trigger an update on the row to fire the `generate_sabca_id` trigger.
        -- We just update the `updated_at` timestamp or re-set the division to itself
        UPDATE public.profiles
        SET 
            division = mod_record.division,
            updated_at = NOW()
        WHERE id = mod_record.id;
        
        RAISE NOTICE 'Reverted moderator ID for user % from %', mod_record.id, mod_record.sabca_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
