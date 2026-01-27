-- Create ramp_transactions table if not exists
CREATE TABLE IF NOT EXISTS ramp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paj_id TEXT UNIQUE NOT NULL,
    user_address TEXT NOT NULL REFERENCES profiles(address),
    type TEXT NOT NULL CHECK (type IN ('onramp', 'offramp')),
    fiat_amount DECIMAL NOT NULL,
    crypto_amount DECIMAL,
    currency TEXT DEFAULT 'NGN',
    mint TEXT,
    status TEXT NOT NULL,
    tx_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE ramp_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own ramp transactions"
    ON ramp_transactions FOR SELECT
    USING (auth.uid()::text = user_address);

-- Admin can view all
CREATE POLICY "Admins can view all ramp transactions"
    ON ramp_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE address = auth.uid()::text AND (seller_tier = 'admin' OR seller_tier = 'premium')
        )
    );
