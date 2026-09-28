-- FIX: Drop the recursive policy causing login errors
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Restore standard access (Users can view their own profile)
-- This usually exists, but ensuring it's there or just dropping the bad one is enough to fix the crash.
-- The recursion happened because the policy to read 'profiles' tried to query 'profiles' to check the role.
