-- 1. Create Index on phone for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 2. Function to lookup email via phone (Securely)
-- SECURITY WARNING: This function allows enumeration of emails by phone number.
-- It is used for the "Login with Phone" flow where the user enters phone+password.
-- Ensure this is only called from trusted clients or reconsider the auth flow.
CREATE OR REPLACE FUNCTION public.get_email_by_phone(p_phone TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM public.profiles
    WHERE phone = p_phone
    LIMIT 1;
    
    RETURN v_email;
END;
$$;

-- 3. Update handle_new_user to save phone number from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'member',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$;
