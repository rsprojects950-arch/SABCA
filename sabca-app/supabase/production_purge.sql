-- Production Database Purge Script
-- Location: supabase/production_purge.sql
-- 
-- 🎯 Objective:
-- Clean up all test/demo data and delete non-admin users to prepare the database for production.
-- All administrator accounts (role = 'admin') will be preserved.
-- 
-- ⚠️ IMPORTANT INSTRUCTIONS:
-- 1. Backup your database BEFORE running this script (using pg_dump or the Supabase dashboard).
-- 2. Run this script in the Supabase SQL Editor.
-- 3. If you want to keep moderators as well, change:
--      role = 'admin'
--    to:
--      role IN ('admin', 'moderator')
--    in the filters below.

BEGIN;

-- =========================================================================
-- 0. PROMOTE USER TO ADMIN (OPTIONAL)
-- =========================================================================
-- If you need to make a normal user an admin so they are preserved,
-- uncomment and customize one of the lines below:
--
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'user@example.com';
-- UPDATE public.profiles SET role = 'admin' WHERE phone = '+919999999999';
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'insert-uuid-here';

-- =========================================================================
-- 1. PRE-CHECK: Verify Admins Exist
-- =========================================================================
DO $$
DECLARE
    admin_count INT;
    admin_emails TEXT;
BEGIN
    SELECT COUNT(*), string_agg(u.email || ' (' || p.role || ')', ', ')
    INTO admin_count, admin_emails
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role = 'admin'; -- Adjust if you want to include moderators here
    
    RAISE NOTICE 'Preserving % admin account(s): %', admin_count, admin_emails;
    
    IF admin_count = 0 THEN
        RAISE EXCEPTION 'CRITICAL ERROR: No admin users found in public.profiles with role = ''admin''. Aborting script to prevent lockout!';
    END IF;
END $$;

-- =========================================================================
-- 2. CLEAR ACTIVITY & TRANSACTION TABLES (Test Data)
-- =========================================================================
-- NOTICE: Clearing activity and transaction tables...

-- A. Transactions & Payment history
TRUNCATE TABLE public.transactions CASCADE;

-- B. Notifications
TRUNCATE TABLE public.notifications CASCADE;

-- C. Event registrations and events
TRUNCATE TABLE public.event_registrations CASCADE;
TRUNCATE TABLE public.events CASCADE; -- Truncates events. Remove/comment if you want to keep pre-created events.

-- D. Grievance tables
TRUNCATE TABLE public.grievance_attachments CASCADE;
TRUNCATE TABLE public.grievance_timeline CASCADE;
TRUNCATE TABLE public.grievances CASCADE;
ALTER SEQUENCE IF EXISTS public.grievance_id_seq RESTART WITH 1;

-- E. Polls
TRUNCATE TABLE public.poll_votes CASCADE;
TRUNCATE TABLE public.poll_options CASCADE;
TRUNCATE TABLE public.poll_questions CASCADE;

-- F. User documents metadata
TRUNCATE TABLE public.documents CASCADE;

-- G. News & Government Orders
TRUNCATE TABLE public.news CASCADE; -- Truncates news articles. Comment if you want to keep news.
TRUNCATE TABLE public.government_orders CASCADE; -- Truncates government orders. Comment if you want to keep GOs.

-- H. Directory Contacts
-- By default, we keep directory contacts as they represent division leaders.
-- If you want to clear them too, uncomment the line below:
-- TRUNCATE TABLE public.directory_contacts CASCADE;

-- =========================================================================
-- 3. DELETE NON-ADMIN USERS (Auth and Profiles)
-- =========================================================================
-- NOTICE: Purging non-admin users...

DO $$
DECLARE
    r RECORD;
    deleted_count INT := 0;
BEGIN
    -- Loop through all users in auth.users that are NOT admins
    FOR r IN (
        SELECT id, email 
        FROM auth.users 
        WHERE id NOT IN (
            SELECT id 
            FROM public.profiles 
            WHERE role = 'admin' -- Adjust to IN ('admin', 'moderator') to keep moderators too
        )
    ) LOOP
        -- Call cascade function to safely clean up any remaining references
        PERFORM public.delete_user_data_cascade(r.id);
        
        -- Delete from auth.users
        DELETE FROM auth.users WHERE id = r.id;
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Successfully deleted % non-admin user(s) from auth.users', deleted_count;
END $$;

-- Clean up any orphaned profiles that are not in auth.users (excluding admins)
DELETE FROM public.profiles 
WHERE (role != 'admin' OR role IS NULL) -- Adjust if keeping moderators
  AND id NOT IN (SELECT id FROM public.profiles WHERE role = 'admin');

-- =========================================================================
-- 4. POST-CHECK: Verify Database State
-- =========================================================================
DO $$
DECLARE
    remaining_users_count INT;
    remaining_profiles_count INT;
BEGIN
    SELECT COUNT(*) INTO remaining_users_count FROM auth.users;
    SELECT COUNT(*) INTO remaining_profiles_count FROM public.profiles;
    
    RAISE NOTICE 'Verification:';
    RAISE NOTICE '- Remaining users in auth.users: %', remaining_users_count;
    RAISE NOTICE '- Remaining profiles in public.profiles: %', remaining_profiles_count;
END $$;

COMMIT;
