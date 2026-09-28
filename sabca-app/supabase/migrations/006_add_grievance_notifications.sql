-- ==========================================
-- AUTOMATION: Grievance Notifications via Triggers
-- ==========================================

-- 1. Helper Function to Insert Notification
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT);

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

-- 2. Trigger for NEW GRIEVANCE (Notify User & Admins)
CREATE OR REPLACE FUNCTION public.handle_new_grievance_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- A. Notify the User who submitted it
    PERFORM public.create_notification(
        NEW.user_id,
        'Grievance Submitted',
        'Your grievance #' || NEW.display_id || ' has been received. We will update you shortly.',
        'info',
        '/services/grievances/' || NEW.id
    );

    -- B. Notify All Admins and Moderators
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

DROP TRIGGER IF EXISTS on_grievance_created ON public.grievances;
CREATE TRIGGER on_grievance_created
AFTER INSERT ON public.grievances
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_grievance_notification();


-- 3. Trigger for STATUS CHANGE (Notify User)
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

    -- Also check if assigned_to has changed (Notify the new moderator AND the User)
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

DROP TRIGGER IF EXISTS on_grievance_updated ON public.grievances;
CREATE TRIGGER on_grievance_updated
AFTER UPDATE ON public.grievances
FOR EACH ROW
EXECUTE FUNCTION public.handle_grievance_status_update();


-- 4. Trigger for NEW COMMENT/TIMELINE (Notify Other Party)
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
    -- Get Grievance Details
    SELECT user_id, display_id, assigned_to 
    INTO v_grievance_owner, v_grievance_display_id, v_assigned_to
    FROM public.grievances
    WHERE id = NEW.grievance_id;

    -- If Commenter is the Owner -> Notify Assigned Moderator (or Admins if none)
    IF NEW.created_by = v_grievance_owner THEN
        IF v_assigned_to IS NOT NULL THEN
             PERFORM public.create_notification(
                v_assigned_to,
                'New Update on Grievance',
                'User added a remark on grievance #' || v_grievance_display_id || '.',
                'info',
                '/admin/grievances/' || NEW.grievance_id
            );
        ELSE
            -- Notify all admins if unassigned (optional, might be too noisy, keeping it simple for now)
            -- For now, we won't spam all admins on every user comment unless assigned.
            NULL; 
        END IF;

    -- If Commenter is NOT Owner (i.e. Admin/Mod) -> Notify Owner
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

DROP TRIGGER IF EXISTS on_grievance_timeline_created ON public.grievance_timeline;
CREATE TRIGGER on_grievance_timeline_created
AFTER INSERT ON public.grievance_timeline
FOR EACH ROW
EXECUTE FUNCTION public.handle_grievance_timeline_notification();
