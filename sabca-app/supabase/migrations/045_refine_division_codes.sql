-- Database migration to update division names and codes
-- This ensures existing member data remains consistent after code updates

-- 1. Update Guntur
UPDATE divisions 
SET name = 'Gunturu Nagarapalaka Samstha (SABCA-GNSA)', code = 'GNSA' 
WHERE name = 'Gunturu Nagarapalaka (SABCA-GMCA)';

UPDATE profiles 
SET division = 'Gunturu Nagarapalaka Samstha (SABCA-GNSA)' 
WHERE division = 'Gunturu Nagarapalaka (SABCA-GMCA)';

UPDATE directory_contacts 
SET division = 'Gunturu Nagarapalaka Samstha (SABCA-GNSA)' 
WHERE division = 'Gunturu Nagarapalaka (SABCA-GMCA)';

-- 2. Update Kakinada & Konaseema
UPDATE divisions 
SET name = 'Kakinada & Konaseema (SABCA-KKD)', code = 'KKD' 
WHERE name = 'Kakinada & Konaseema (SABCA-KKCA)';

UPDATE profiles 
SET division = 'Kakinada & Konaseema (SABCA-KKD)' 
WHERE division = 'Kakinada & Konaseema (SABCA-KKCA)';

UPDATE directory_contacts 
SET division = 'Kakinada & Konaseema (SABCA-KKD)' 
WHERE division = 'Kakinada & Konaseema (SABCA-KKCA)';

-- 3. Update Greater Visakha
UPDATE divisions 
SET name = 'Greater Visakha (SABCA-GVMC)', code = 'GVMC' 
WHERE name = 'Greater Visakha (SABCA-GVMC-CWA)';

UPDATE profiles 
SET division = 'Greater Visakha (SABCA-GVMC)' 
WHERE division = 'Greater Visakha (SABCA-GVMC-CWA)';

UPDATE directory_contacts 
SET division = 'Greater Visakha (SABCA-GVMC)' 
WHERE division = 'Greater Visakha (SABCA-GVMC-CWA)';
