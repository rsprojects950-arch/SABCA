-- Add separate columns for father_name and spouse_name
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS spouse_name TEXT;

-- Migrate existing data to father_name as a default
UPDATE profiles 
SET father_name = father_or_spouse_name 
WHERE father_name IS NULL AND father_or_spouse_name IS NOT NULL;

-- Drop the obsolete combined column
ALTER TABLE profiles 
DROP COLUMN IF EXISTS father_or_spouse_name;
