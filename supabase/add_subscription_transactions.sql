-- Create subscription_transactions table for tracking payments

CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id),
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'SOL',
  tx_signature TEXT UNIQUE NOT NULL,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user 
ON subscription_transactions(user_address);

CREATE INDEX IF NOT EXISTS idx_subscription_transactions_signature 
ON subscription_transactions(tx_signature);

-- Add billing_cycle column to user_subscriptions if not exists
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' 
CHECK (billing_cycle IN ('monthly', 'yearly'));
