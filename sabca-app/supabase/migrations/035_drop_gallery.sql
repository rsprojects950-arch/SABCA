-- Drop the gallery_albums table
-- Note: Associated images in the 'gallery' storage bucket must be deleted manually if storage cleanup is desired.
DROP TABLE IF EXISTS public.gallery_albums CASCADE;
