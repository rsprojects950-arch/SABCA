-- FIX: Re-create notification function and all triggers to ensure signature match
-- This fixes the error: function public.create_notification(uuid, unknown, text, unknown) does not exist

-- 1. Drop old function versions to be safe (both 4 and 5 args)
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT);

-- 2. Re-create the 5-argument function
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT,
    p_action_path TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, action_path)
    VALUES (p_user_id, p_title, p_message, p_type, p_action_path);
END;
$$;

-- 3. Re-create the triggers with correct 5-argument calls

-- A. Trigger for NEW GRIEVANCE
CREATE OR REPLACE FUNCTION public.handle_new_grievance_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- Notify the User
    PERFORM public.create_notification(
        NEW.user_id,
        'Grievance Submitted',
        'Your grievance #' || NEW.display_id || ' has been received. We will update you shortly.',
        'info',
        '/services/grievances/' || NEW.id
    );

    -- Notify Admins
    FOR admin_record IN 
        SELECT id FROM public.profiles 
        WHERE role IN ('admin', 'moderator')
    LOOP
        PERFORM public.create_notification(
            admin_record.id,
            'New Grievance Received',
            'A new grievance #' || NEW.display_id || ' (' || NEW.category || ') has been submitted.',
            'warning',
            '/admin/grievances/' || NEW.id
        );
    END LOOP;

    RETURN NEW;
END;
$$;

-- B. Trigger for STATUS CHANGE
CREATE OR REPLACE FUNCTION public.handle_grievance_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only notify if status has changed
    IF OLD.status <> NEW.status THEN
        PERFORM public.create_notification(
            NEW.user_id,
            'Grievance Status Updated',
            'Your grievance #' || NEW.display_id || ' is now ' || NEW.status || '.',
            CASE 
                WHEN NEW.status = 'Resolved' THEN 'success'
                WHEN NEW.status = 'Escalated' THEN 'error'
                ELSE 'info'
            END,
            '/services/grievances/' || NEW.id
        );
    END IF;

    -- Also check if assigned_to has changed
    IF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) AND (NEW.assigned_to IS NOT NULL) THEN
        -- 1. Notify the Moderator
        PERFORM public.create_notification(
            NEW.assigned_to,
            'Grievance Assigned',
            'You have been assigned to grievance #' || NEW.display_id || '.',
            'info',
            '/admin/grievances/' || NEW.id
        );

        -- 2. Notify the User
        PERFORM public.create_notification(
            NEW.user_id,
            'Moderator Assigned',
            'A moderator has been assigned to your grievance #' || NEW.display_id || '.',
            'info',
            '/services/grievances/' || NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$;

-- C. Trigger for COMMENTS
CREATE OR REPLACE FUNCTION public.handle_grievance_timeline_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_grievance_owner UUID;
    v_grievance_display_id TEXT;
    v_assigned_to UUID;
BEGIN
    SELECT user_id, display_id, assigned_to 
    INTO v_grievance_owner, v_grievance_display_id, v_assigned_to
    FROM public.grievances
    WHERE id = NEW.grievance_id;

    -- If Commenter is Owner -> Notify Assigne
    IF NEW.created_by = v_grievance_owner THEN
        IF v_assigned_to IS NOT NULL THEN
             PERFORM public.create_notification(
                v_assigned_to,
                'New Update on Grievance',
                'User added a remark on grievance #' || v_grievance_display_id || '.',
                'info',
                '/admin/grievances/' || NEW.grievance_id
            );
        END IF;

    -- If Commenter is Admin -> Notify Owner
    ELSE
        PERFORM public.create_notification(
            v_grievance_owner,
            'New Update on Grievance',
            'An admin added a remark on your grievance #' || v_grievance_display_id || '.',
            'info',
            '/services/grievances/' || NEW.grievance_id
        );
    END IF;

    RETURN NEW;
END;
$$;
