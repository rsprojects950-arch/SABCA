-- Function to automatically send notifications to targeted users when a new poll is created
CREATE OR REPLACE FUNCTION public.handle_new_poll_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Only notify for active polls
    IF NEW.status = 'active' THEN
        
        -- Loop through appropriate users based on target_audience
        FOR user_record IN 
            SELECT id FROM public.profiles 
            WHERE 
                (NEW.target_audience = 'all')
                OR (NEW.target_audience = 'life_members' AND membership_type = 'Life')
                OR (NEW.target_audience = 'board_members' AND role = 'board_member')
                OR (NEW.target_audience = 'specific_division' AND division = NEW.target_division)
        LOOP
            -- Don't notify the creator
            IF user_record.id != NEW.created_by THEN
                PERFORM public.create_notification(
                    user_record.id,
                    'New Community Poll 📊',
                    'A new poll has been posted: "' || substring(NEW.question from 1 for 50) || (CASE WHEN length(NEW.question) > 50 THEN '...' ELSE '' END) || '"',
                    'info',
                    '/events?view=polls'
                );
            END IF;
        END LOOP;
        
    END IF;

    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_poll_created ON public.poll_questions;
CREATE TRIGGER on_poll_created
    AFTER INSERT ON public.poll_questions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_poll_notification();
