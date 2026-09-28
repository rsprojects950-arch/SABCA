-- Migration 024: SAFE Restrict Moderator Visibility by Division
-- Prevents infinite recursion by using SECURITY DEFINER functions

-- 1. Helper function for Admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Helper function for Moderator check
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'moderator'
  );
END;
$$;

-- 3. Helper function to get current user's division
CREATE OR REPLACE FUNCTION public.get_my_division()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT division FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$;

-- 4. Recreate the visibility policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profile visibility policy" ON public.profiles;

CREATE POLICY "Profile visibility policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own profile
  auth.uid() = id
  OR
  -- Admins can see EVERYONE
  public.is_admin()
  OR
  -- Moderators can see members of their OWN division
  (public.is_moderator() AND public.get_my_division() = profiles.division)
);
