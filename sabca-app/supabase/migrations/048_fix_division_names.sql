-- Database migration to update division names and codes (Revert/Fix)
-- 1. Update Guntur
UPDATE divisions 
SET name = 'Guntur Nagarapalaka Samata (SABCA-GMCA)', code = 'GMCA' 
WHERE name = 'Gunturu Nagarapalaka Samstha (SABCA-GNSA)';

UPDATE profiles 
SET division = 'Guntur Nagarapalaka Samata (SABCA-GMCA)' 
WHERE division = 'Gunturu Nagarapalaka Samstha (SABCA-GNSA)';

UPDATE directory_contacts 
SET division = 'Guntur Nagarapalaka Samata (SABCA-GMCA)' 
WHERE division = 'Gunturu Nagarapalaka Samstha (SABCA-GNSA)';

-- 2. Update Kakinada & Konaseema
UPDATE divisions 
SET name = 'Kakinada & Konaseema (SABCA-KKCA)', code = 'KKCA' 
WHERE name = 'Kakinada & Konaseema (SABCA-KKD)';

UPDATE profiles 
SET division = 'Kakinada & Konaseema (SABCA-KKCA)' 
WHERE division = 'Kakinada & Konaseema (SABCA-KKD)';

UPDATE directory_contacts 
SET division = 'Kakinada & Konaseema (SABCA-KKCA)' 
WHERE division = 'Kakinada & Konaseema (SABCA-KKD)';

-- 3. Update Greater Visakha
UPDATE divisions 
SET name = 'Greater Visakha (SABCA-GVMC-CWA)', code = 'GVMC-CWA' 
WHERE name = 'Greater Visakha (SABCA-GVMC)';

UPDATE profiles 
SET division = 'Greater Visakha (SABCA-GVMC-CWA)' 
WHERE division = 'Greater Visakha (SABCA-GVMC)';

UPDATE directory_contacts 
SET division = 'Greater Visakha (SABCA-GVMC-CWA)' 
WHERE division = 'Greater Visakha (SABCA-GVMC)';
