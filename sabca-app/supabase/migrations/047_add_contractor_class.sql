-- Add contractor_class to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS contractor_class TEXT;
