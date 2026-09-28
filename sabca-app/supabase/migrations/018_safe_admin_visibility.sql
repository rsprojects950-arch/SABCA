-- SAFE FIX for Admin Visibility
-- Prevents infinite recursion by using a SECURITY DEFINER function

-- 1. Create a secure function to check user role
-- "SECURITY DEFINER" means this function runs with the privileges of the creator (postgres/superuser),
-- bypassing RLS on the 'profiles' table when it reads the role.
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'moderator')
  );
END;
$$;

-- 2. Drop the old policy (just in case it lingers or was recreated)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 3. Create the new policy using the secure function
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own profile (usually covered by another policy, but safe to include)
  auth.uid() = id
  OR
  -- Admins/Mods can see EVERYONE, checked securely
  public.is_admin_or_moderator()
);
