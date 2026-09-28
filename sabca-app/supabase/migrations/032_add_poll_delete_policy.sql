-- Add the missing DELETE policy for poll_questions so Admins and Moderators can remove polls
CREATE POLICY "Only admins and moderators can delete polls" ON public.poll_questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'moderator')
        )
    );
