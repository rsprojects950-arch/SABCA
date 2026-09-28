-- Migration 020: Master User Deletion RPC
-- This creates a single, atomic function to handle all database-level deletions
-- for a user, ensuring foreign key constraints are handled in the correct order.

CREATE OR REPLACE FUNCTION public.delete_user_data_cascade(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Notifications
    -- Delete all notifications received by or related to the user
    DELETE FROM public.notifications WHERE user_id = p_user_id;
    
    -- 2. Transactions 
    -- Delete all membership/payment records
    DELETE FROM public.transactions WHERE user_id = p_user_id;
    
    -- 3. Documents
    -- Delete metadata for user-uploaded documents
    DELETE FROM public.documents WHERE user_id = p_user_id;
    
    -- 4. Event Registrations
    DELETE FROM public.event_registrations WHERE user_id = p_user_id;
    
    -- 5. Grievances cleanup
    -- A. Nullify assignments (if the deleted user was a moderator)
    UPDATE public.grievances SET assigned_to = NULL WHERE assigned_to = p_user_id;
    
    -- B. Timeline entries created by the user (as remarks/updates)
    DELETE FROM public.grievance_timeline WHERE created_by = p_user_id;
    
    -- C. Sub-data for grievances OWNED by the user
    -- We must delete timeline and attachments first
    DELETE FROM public.grievance_timeline 
    WHERE grievance_id IN (SELECT id FROM public.grievances WHERE user_id = p_user_id);
    
    DELETE FROM public.grievance_attachments 
    WHERE grievance_id IN (SELECT id FROM public.grievances WHERE user_id = p_user_id);
    
    -- D. Finally delete the grievances themselves
    DELETE FROM public.grievances WHERE user_id = p_user_id;
    
    -- 6. Profile
    -- Delete the profile last
    DELETE FROM public.profiles WHERE id = p_user_id;
END;
$$;
