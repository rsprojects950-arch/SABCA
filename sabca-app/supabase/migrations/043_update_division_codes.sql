-- Migration: Update Division Codes and Names
-- This migration updates certain division codes and their corresponding names in the divisions table, 
-- and ensures all references in profiles and directory_contacts are updated for consistency.

-- 1. Update divisions table
UPDATE public.divisions 
SET name = 'Gunturu Nagarapalaka (SABCA-GMCA)', code = 'GMCA' 
WHERE name = 'Gunturu Nagarapalaka (SABCA-GNSA)';

UPDATE public.divisions 
SET name = 'Kakinada & Konaseema (SABCA-KKCA)', code = 'KKCA' 
WHERE name = 'Kakinada & Konaseema (SABCA-KKD)';

UPDATE public.divisions 
SET name = 'Vizianagaram (SABCA-RCA-VZMD)', code = 'RCA-VZMD' 
WHERE name = 'Vizianagaram (SABCA-RCA-VZM)';

-- 2. Update profiles table (uses the full name string as the reference)
UPDATE public.profiles 
SET division = 'Gunturu Nagarapalaka (SABCA-GMCA)' 
WHERE division = 'Gunturu Nagarapalaka (SABCA-GNSA)';

UPDATE public.profiles 
SET division = 'Kakinada & Konaseema (SABCA-KKCA)' 
WHERE division = 'Kakinada & Konaseema (SABCA-KKD)';

UPDATE public.profiles 
SET division = 'Vizianagaram (SABCA-RCA-VZMD)' 
WHERE division = 'Vizianagaram (SABCA-RCA-VZM)';

-- 3. Update directory_contacts table (uses the code string as the reference)
UPDATE public.directory_contacts SET division = 'GMCA' WHERE division = 'GNSA';
UPDATE public.directory_contacts SET division = 'KKCA' WHERE division = 'KKD';
UPDATE public.directory_contacts SET division = 'RCA-VZMD' WHERE division = 'RCA-VZM';
