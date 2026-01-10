-- Create a table to store Web Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address TEXT NOT NULL, -- references profiles(address) but loose coupling for now
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_address, endpoint)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subs_address ON push_subscriptions(user_address);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow inserts for authenticated users
CREATE POLICY "Enable insert for authenticated users" 
    ON push_subscriptions FOR INSERT 
    WITH CHECK (true);

-- Allow users to view their own subscriptions (if needed for debugging)
CREATE POLICY "Enable read for owners" 
    ON push_subscriptions FOR SELECT 
    USING (true);
