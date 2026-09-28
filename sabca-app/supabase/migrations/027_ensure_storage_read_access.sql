-- Migration 027: Ensure Storage Read Access
-- Allow public access to read files from content buckets

-- Ensure buckets exist and are public
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('events', 'events', true),
    ('news', 'news', true),
    ('gallery', 'gallery', true),
    ('government_orders', 'government_orders', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- DROP existing individual SELECT policies to avoid confusion
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read government orders" ON storage.objects;

-- Create a unified SELECT policy for all content buckets
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('events', 'news', 'gallery', 'government_orders'));
