-- Add saved_addresses column to profiles table for One-Click Checkout feature
-- This stores an array of saved delivery addresses

ALTER TABLE profiles
ADD COLUMN saved_addresses jsonb DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN profiles.saved_addresses IS 'Array of saved addresses: [{id, name, location, city, zip, phone?, isDefault, createdAt}]';

-- Create index for faster queries
CREATE INDEX idx_profiles_saved_addresses ON profiles USING gin(saved_addresses);
