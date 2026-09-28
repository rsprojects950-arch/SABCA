-- Create directory_contacts table
CREATE TABLE IF NOT EXISTS public.directory_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    division TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.directory_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view directory contacts
CREATE POLICY "Enable read access for all users" ON public.directory_contacts
    FOR SELECT USING (true);

-- Policy: Super admins and moderators can insert
CREATE POLICY "Enable insert for admins and moderators" ON public.directory_contacts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'moderator')
        )
    );

-- Policy: Super admins and moderators can update
CREATE POLICY "Enable update for admins and moderators" ON public.directory_contacts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'moderator')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'moderator')
        )
    );

-- Policy: Super admins and moderators can delete
CREATE POLICY "Enable delete for admins and moderators" ON public.directory_contacts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'moderator')
        )
    );

-- Add realtime capability for real-time contact updates (optional but good for consistency)
alter publication supabase_realtime add table public.directory_contacts;
