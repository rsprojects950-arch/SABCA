-- 1. Enable pg_cron extension (requires dashboard activation usually, but this script ensures it's ready)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule Cleanup (Runs daily at 3:00 AM IST)
-- 3:00 AM IST = 9:30 PM UTC
SELECT cron.schedule(
  'system-cleanup-3am-ist',
  '30 21 * * *',
  $$ SELECT public.cleanup_expired_content(); $$
);

-- 3. Schedule Grievance Escalation (Runs every 6 hours IST)
-- 00:00, 06:00, 12:00, 18:00 IST translates to UTC:
-- 18:30, 00:30, 06:30, 12:30 UTC
SELECT cron.schedule(
  'grievance-escalation-6hr-ist',
  '30 0,6,12,18 * * *',
  $$ SELECT public.manage_grievance_priorities(); $$
);

-- Verification: You can check active jobs with:
-- SELECT * FROM cron.job;
