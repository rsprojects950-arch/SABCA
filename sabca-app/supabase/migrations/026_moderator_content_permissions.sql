-- Migration 026: Moderator Content Publishing Permissions
-- Grant Moderators management access to Events, News, Gallery, and GO

-- 1. Table Permissions (INSERT, UPDATE, DELETE)

-- Government Orders (Update existing policies)
DROP POLICY IF EXISTS "Only admins can insert government orders" ON public.government_orders;
CREATE POLICY "Admins/Mods can insert government orders" ON public.government_orders
    FOR INSERT WITH CHECK (public.is_admin() OR public.is_moderator());

DROP POLICY IF EXISTS "Only admins can update government orders" ON public.government_orders;
CREATE POLICY "Admins/Mods can update government orders" ON public.government_orders
    FOR UPDATE USING (public.is_admin() OR public.is_moderator());

DROP POLICY IF EXISTS "Only admins can delete government orders" ON public.government_orders;
CREATE POLICY "Admins/Mods can delete government orders" ON public.government_orders
    FOR DELETE USING (public.is_admin() OR public.is_moderator());


-- News
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins/Mods can manage news" ON public.news;
CREATE POLICY "Admins/Mods can manage news" ON public.news
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_moderator())
    WITH CHECK (public.is_admin() OR public.is_moderator());


-- Events (Delete already partially handled, but unifying)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins/Mods can manage events" ON public.events;
CREATE POLICY "Admins/Mods can manage events" ON public.events
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_moderator())
    WITH CHECK (public.is_admin() OR public.is_moderator());


-- Gallery Albums
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins/Mods can manage gallery" ON public.gallery_albums;
CREATE POLICY "Admins/Mods can manage gallery" ON public.gallery_albums
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_moderator())
    WITH CHECK (public.is_admin() OR public.is_moderator());


-- 2. Storage Bucket Permissions (INSERT, UPDATE)

-- unify storage policies for content buckets
-- Note: 'gallery' bucket might already exist

DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admins/Mods can upload content" ON storage.objects;

CREATE POLICY "Admins/Mods can upload content" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id IN ('events', 'news', 'gallery', 'government_orders') 
    AND (public.is_admin() OR public.is_moderator())
);

CREATE POLICY "Admins/Mods can update content" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id IN ('events', 'news', 'gallery', 'government_orders') 
    AND (public.is_admin() OR public.is_moderator())
);

CREATE POLICY "Admins/Mods can delete content" 
ON storage.objects FOR DELETE 
USING (
    bucket_id IN ('events', 'news', 'gallery', 'government_orders') 
    AND (public.is_admin() OR public.is_moderator())
);
