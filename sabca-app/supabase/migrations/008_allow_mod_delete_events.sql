-- Update RLS to allow Moderators to delete events

-- 1. Drop existing "Admins can delete events" policy
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- 2. Create new policy for Admins AND Moderators
DROP POLICY IF EXISTS "Admins/Mods can delete events" ON public.events;
CREATE POLICY "Admins/Mods can delete events"
ON public.events FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'moderator')
  )
);
