-- Enable Supabase Realtime for the poll_votes table 
-- This broadcasts INSERT events over WebSockets to instantly update poll results in the app
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
