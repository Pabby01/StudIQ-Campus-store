-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- 'free', 'premium', 'enterprise'
  display_name TEXT NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  price_sol DECIMAL(10,4),
  platform_fee_percentage DECIMAL(5,2) NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  payment_method TEXT CHECK (payment_method IN ('sol', 'usdc', 'card')),
  transaction_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Fees Tracking Table
CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  seller_address TEXT NOT NULL,
  seller_plan TEXT NOT NULL,
  fee_percentage DECIMAL(5,2) NOT NULL,
  fee_amount DECIMAL(10,4) NOT NULL,
  fee_currency TEXT NOT NULL,
  order_amount DECIMAL(10,4) NOT NULL,
  seller_payout DECIMAL(10,4) NOT NULL,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_address ON user_subscriptions(user_address);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_platform_fees_seller ON platform_fees(seller_address);
CREATE INDEX IF NOT EXISTS idx_platform_fees_order ON platform_fees(order_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, display_name, price_usd, price_sol, platform_fee_percentage, features) VALUES
('free', 'Free', 0.00, 0, 5.00, '{"features": ["List unlimited products", "Basic analytics", "Standard support", "Earn points", "5% platform fee"]}'),
('premium', 'Premium', 14.99, 0.075, 2.00, '{"features": ["Everything in Free", "2% platform fee (save 3%)", "Premium badge", "Priority placement", "2x points earning", "Advanced analytics", "Priority support"]}'),
('enterprise', 'Enterprise', 49.99, 0.25, 0.00, '{"features": ["Everything in Premium", "0% platform fee", "Dedicated account manager", "API access", "Custom integrations", "White-label options", "Bulk upload tools", "Advanced fraud protection"]}')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_usd = EXCLUDED.price_usd,
  price_sol = EXCLUDED.price_sol,
  platform_fee_percentage = EXCLUDED.platform_fee_percentage,
  features = EXCLUDED.features,
  updated_at = NOW();
