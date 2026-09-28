-- Fix poll notifications trigger to use correct schema

CREATE OR REPLACE FUNCTION public.handle_new_poll_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify for active polls
    IF NEW.status = 'active' THEN
        BEGIN
            INSERT INTO public.notifications (user_id, title, message, type, action_path)
            SELECT 
                p.id,
                'New Poll Available 📊',
                'A new poll has been posted: "' || LEFT(NEW.question, 50) || (CASE WHEN length(NEW.question) > 50 THEN '...' ELSE '' END) || '"',
                'info',
                '/events?view=polls'
            FROM public.profiles p
            WHERE 
                (
                    (NEW.target_audience = 'all') OR 
                    (NEW.target_audience = 'specific_division' AND p.division = NEW.target_division)
                )
                AND p.id != NEW.created_by;
        EXCEPTION WHEN OTHERS THEN
            -- Log the error but don't fail the transaction
            RAISE WARNING 'Failed to send poll notifications: %', SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
