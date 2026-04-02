-- Run this in Supabase SQL Editor to add 'installer' as a valid role
-- (if your profiles table only had supervisor/accounts/admin)

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'supervisor', 'installer', 'accounts'));
