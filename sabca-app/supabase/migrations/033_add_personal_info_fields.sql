-- Add new personal information fields to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS aadhaar_number TEXT,
ADD COLUMN IF NOT EXISTS father_or_spouse_name TEXT,
ADD COLUMN IF NOT EXISTS anniversary_date DATE,
ADD COLUMN IF NOT EXISTS blood_group TEXT;
