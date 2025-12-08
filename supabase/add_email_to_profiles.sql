-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update RLS policies if needed (email should be readable by anyone)
-- The existing policies should already cover this, but verify in Supabase dashboard
