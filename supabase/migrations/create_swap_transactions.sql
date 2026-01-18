-- Create swap_transactions table for tracking token swaps
CREATE TABLE IF NOT EXISTS swap_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    from_token TEXT NOT NULL,
    to_token TEXT NOT NULL,
    from_amount DECIMAL(20, 8) NOT NULL,
    to_amount DECIMAL(20, 8) NOT NULL,
    fee_amount DECIMAL(20, 8) NOT NULL,
    fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 2.0,
    exchange_rate DECIMAL(20, 8) NOT NULL,
    usd_value DECIMAL(20, 2) NOT NULL,
    cluster TEXT NOT NULL DEFAULT 'devnet',
    status TEXT NOT NULL DEFAULT 'completed',
    tx_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_swap_transactions_user ON swap_transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_swap_transactions_created ON swap_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swap_transactions_status ON swap_transactions(status);

-- Add RLS policies
ALTER TABLE swap_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own swap transactions
CREATE POLICY "Users can view own swaps"
    ON swap_transactions
    FOR SELECT
    USING (auth.uid()::text = user_address OR user_address IN (
        SELECT address FROM profiles WHERE id = auth.uid()
    ));

-- Users can insert their own swap transactions
CREATE POLICY "Users can create own swaps"
    ON swap_transactions
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_address OR user_address IN (
        SELECT address FROM profiles WHERE id = auth.uid()
    ));

-- Add comment
COMMENT ON TABLE swap_transactions IS 'Records all token swap transactions with fees and exchange rates';
