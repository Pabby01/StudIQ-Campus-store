-- Migration: Add Civic Auth Support
-- Date: 2026-01-05
-- Description: Adds Civic Auth fields to profiles table for email-based authentication

BEGIN;

-- Add Civic-specific fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS civic_user_id TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS verified_email BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_civic_user_id_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_civic_user_id_unique UNIQUE(civic_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE(email);
  END IF;
END$$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_civic_user_id ON profiles(civic_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update RLS policies to work with both address and civic_user_id
DROP POLICY IF EXISTS "profiles_update_self"  ON profiles;

CREATE POLICY "profiles_update_self" ON profiles 
FOR UPDATE 
USING (
  address = current_setting('request.header.sid', true) 
  OR 
  civic_user_id = current_setting('request.header.civic_user_id', true)
) 
WITH CHECK (
  address = current_setting('request.header.sid', true)
  OR
  civic_user_id = current_setting('request.header.civic_user_id', true)
);

-- Drop old wallet_auth_nonce table (no longer needed with Civic)
DROP TABLE IF EXISTS wallet_auth_nonce CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.civic_user_id IS 'Unique identifier from Civic Auth (sub claim from JWT)';
COMMENT ON COLUMN profiles.email IS 'User email from Civic Auth, used for login';
COMMENT ON COLUMN profiles.verified_email IS 'Whether email has been verified by Civic';

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added Civic Auth support to profiles table';
END$$;
