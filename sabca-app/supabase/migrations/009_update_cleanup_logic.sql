CREATE OR REPLACE FUNCTION public.cleanup_expired_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Delete events that are older than 3 days
  DELETE FROM public.events
  WHERE event_date < (CURRENT_DATE - INTERVAL '3 days');

  -- 2. Delete news that are older than 7 days
  DELETE FROM public.news
  WHERE "date"::DATE < (CURRENT_DATE - INTERVAL '7 days');

  -- 3. Delete notifications older than 14 days
  -- EXCLUDING membership renewal alerts to ensure users see them
  DELETE FROM public.notifications
  WHERE created_at < (CURRENT_DATE - INTERVAL '14 days')
    AND title != 'Membership Expiring Soon';
    
END;
$$;
