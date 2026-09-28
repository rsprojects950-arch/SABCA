-- 1. Drop Tables (CASCADE handles triggers and dependent functions if linked)
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;

-- 2. Drop Functions
DROP FUNCTION IF EXISTS public.handle_new_like();
DROP FUNCTION IF EXISTS public.handle_unlike();

-- 3. Drop Storage Bucket
-- NOTE: Supabase prevents direct deletion from storage.buckets via SQL to avoid orphaned files.
-- Please delete the 'post-images' bucket manually from the Supabase Dashboard -> Storage.
-- DELETE FROM storage.buckets WHERE id = 'post-images';
