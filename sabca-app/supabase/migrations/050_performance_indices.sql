-- 1. Index for Member Directory and Filtering by Division
CREATE INDEX IF NOT EXISTS idx_profiles_division ON public.profiles(division);

-- 2. Index for Admin Users List and Role Filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Index for Membership Expiry and Paid Status (for batch checks)
CREATE INDEX IF NOT EXISTS idx_profiles_membership ON public.profiles(is_paid_member, membership_expiry);

-- 4. Index for Grievance Filtering by Status and Division
CREATE INDEX IF NOT EXISTS idx_grievances_status_division ON public.grievances(status, division_id);

-- 5. Index for Grievance User Lookups
CREATE INDEX IF NOT EXISTS idx_grievances_user_id ON public.grievances(user_id);
