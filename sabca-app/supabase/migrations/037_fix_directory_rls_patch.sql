-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable insert for admins and moderators" ON public.directory_contacts;
DROP POLICY IF EXISTS "Enable update for admins and moderators" ON public.directory_contacts;
DROP POLICY IF EXISTS "Enable delete for admins and moderators" ON public.directory_contacts;

-- Policy: Admins and moderators can insert
CREATE POLICY "Enable insert for admins and moderators" ON public.directory_contacts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'moderator')
        )
    );

-- Policy: Admins and moderators can update
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

-- Policy: Admins and moderators can delete
CREATE POLICY "Enable delete for admins and moderators" ON public.directory_contacts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'moderator')
        )
    );
