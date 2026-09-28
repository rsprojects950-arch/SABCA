-- Migration 051: Add secure phone login verification function
-- Prevents account enumeration by verifying phone and password in one step.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE OR REPLACE FUNCTION public.verify_login_by_phone(
  p_phone TEXT,
  p_password TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT;
  v_user_id UUID;
  v_pwd_hash TEXT;
BEGIN
  -- 1. Find user profile with this phone number
  SELECT id, email INTO v_user_id, v_email
  FROM public.profiles
  WHERE phone = p_phone
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Fetch password hash from auth.users (requires security definer)
  SELECT encrypted_password INTO v_pwd_hash
  FROM auth.users
  WHERE id = v_user_id;

  -- 3. Verify password hash using pgcrypto's crypt() function
  IF v_pwd_hash IS NOT NULL AND v_pwd_hash = crypt(p_password, v_pwd_hash) THEN
    RETURN v_email;
  END IF;

  RETURN NULL;
END;
$$;
