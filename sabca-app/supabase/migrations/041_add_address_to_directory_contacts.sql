-- Add address column to directory_contacts
ALTER TABLE public.directory_contacts
ADD COLUMN IF NOT EXISTS address TEXT;
