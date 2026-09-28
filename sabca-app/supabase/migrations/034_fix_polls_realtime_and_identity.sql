-- 1. Enable Supabase Realtime for poll_questions (if not already enabled)
-- This ensures the app gets notified when new polls are created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'poll_questions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_questions;
    END IF;
END $$;

-- 2. Set REPLICA IDENTITY FULL for both tables
-- This ensures that Realtime DELETE events contain the full row data (needed for local state mapping)
ALTER TABLE public.poll_questions REPLICA IDENTITY FULL;
ALTER TABLE public.poll_votes REPLICA IDENTITY FULL;

-- 3. Ensure DELETE policy exists for poll_questions (Double check from migration 032)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'poll_questions' 
        AND policyname = 'Only admins and moderators can delete polls'
    ) THEN
        CREATE POLICY "Only admins and moderators can delete polls" ON public.poll_questions
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND (role = 'admin' OR role = 'moderator')
                )
            );
    END IF;
END $$;

-- 4. Harden the notification trigger to prevent failures during poll creation
-- We use a more robust error handling approach to ensure poll insertion isn't blocked by notification issues
CREATE OR REPLACE FUNCTION public.handle_new_poll_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify for active polls
    IF NEW.status = 'active' THEN
        BEGIN
            INSERT INTO public.notifications (user_id, title, message, type, related_id)
            SELECT 
                p.id,
                'New Poll Available',
                'A new poll has been posted: ' || LEFT(NEW.question, 50) || '...',
                'poll',
                NEW.id
            FROM public.profiles p
            WHERE 
                (NEW.target_audience = 'all') OR 
                (NEW.target_audience = 'specific_division' AND p.division = NEW.target_division);
        EXCEPTION WHEN OTHERS THEN
            -- Log the error but don't fail the transaction
            RAISE WARNING 'Failed to send poll notifications: %', SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
