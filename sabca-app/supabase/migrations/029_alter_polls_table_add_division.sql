-- Add target_division column to store the specific division name for targeted polls
ALTER TABLE public.poll_questions 
    ADD COLUMN target_division TEXT;
