-- Create government_orders table
CREATE TABLE IF NOT EXISTS public.government_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.government_orders ENABLE ROW LEVEL SECURITY;

-- Policies for government_orders
DROP POLICY IF EXISTS "Government orders are viewable by everyone" ON public.government_orders;
CREATE POLICY "Government orders are viewable by everyone" ON public.government_orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can insert government orders" ON public.government_orders;
CREATE POLICY "Only admins can insert government orders" ON public.government_orders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Only admins can update government orders" ON public.government_orders;
CREATE POLICY "Only admins can update government orders" ON public.government_orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Only admins can delete government orders" ON public.government_orders;
CREATE POLICY "Only admins can delete government orders" ON public.government_orders
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create storage bucket for government_orders
-- Note: This usually needs to be done via the Supabase Dashboard or API.
-- This SQL only sets up the permissions if the bucket is created.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('government_orders', 'government_orders', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'government_orders');

DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'government_orders' AND 
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
