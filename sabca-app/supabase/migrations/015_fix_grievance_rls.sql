-- ==========================================
-- FIX: Enable Admin/Moderator Access to Timeline & Attachments
-- ==========================================

-- 1. Enable RLS (Should be already enabled, but ensuring)
ALTER TABLE public.grievance_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievance_attachments ENABLE ROW LEVEL SECURITY;

-- 2. TIMELINE POLICIES

-- View: Admins/Mods can view ALL entries. Users can view entries for their OWN grievances (existing policy likely handles this, but we add Admin explicitly).
DROP POLICY IF EXISTS "Admins can view all timeline" ON public.grievance_timeline;
CREATE POLICY "Admins can view all timeline"
ON public.grievance_timeline
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
  OR
  -- Keep existing User access (Users see timeline for grievances they created)
  grievance_id IN (
      SELECT id FROM public.grievances WHERE user_id = auth.uid()
  )
);

-- Insert: Admins/Mods can insert entries
DROP POLICY IF EXISTS "Admins can insert timeline" ON public.grievance_timeline;
CREATE POLICY "Admins can insert timeline"
ON public.grievance_timeline
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
  OR
  -- Keep existing User access
  grievance_id IN (
      SELECT id FROM public.grievances WHERE user_id = auth.uid()
  )
);

-- 3. ATTACHMENT POLICIES

-- View
DROP POLICY IF EXISTS "Admins can view all attachments" ON public.grievance_attachments;
CREATE POLICY "Admins can view all attachments"
ON public.grievance_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
  OR
  grievance_id IN (
      SELECT id FROM public.grievances WHERE user_id = auth.uid()
  )
);

-- Insert
DROP POLICY IF EXISTS "Admins can upload attachments" ON public.grievance_attachments;
CREATE POLICY "Admins can upload attachments"
ON public.grievance_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
  OR
  grievance_id IN (
      SELECT id FROM public.grievances WHERE user_id = auth.uid()
  )
);
