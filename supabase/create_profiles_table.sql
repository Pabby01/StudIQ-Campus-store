-- Create or update profiles table for user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  school TEXT,
  campus TEXT,
  level TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on address for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_address ON profiles(address);

-- Create index on email for searches
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
