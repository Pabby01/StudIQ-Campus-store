-- Authentication Tables
CREATE TABLE IF NOT EXISTS wallet_auth_nonce (
    address TEXT PRIMARY KEY,
    nonce TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
    address TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    school TEXT,
    campus TEXT,
    level TEXT,
    phone TEXT,
    tier TEXT DEFAULT 'basic',
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_nonce_expires ON wallet_auth_nonce(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles(created_at);

-- Enable Row Level Security
ALTER TABLE wallet_auth_nonce ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet_auth_nonce (public access for auth flow)
CREATE POLICY "Anyone can insert nonce" ON wallet_auth_nonce
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can select their own nonce" ON wallet_auth_nonce
    FOR SELECT USING (true);

CREATE POLICY "Anyone can delete their own nonce" ON wallet_auth_nonce
    FOR DELETE USING (true);

-- RLS Policies for profiles
CREATE POLICY "Anyone can insert profile" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (true);

-- Function to clean up expired nonces
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS void AS $$
BEGIN
    DELETE FROM wallet_auth_nonce
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to clean up expired nonces (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-nonces', '*/5 * * * *', 'SELECT cleanup_expired_nonces()');
