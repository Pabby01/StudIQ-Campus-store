-- Add location and device tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS device_type VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS device_os VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS browser VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS browser_version VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Create user_activity tracking table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address VARCHAR(255) NOT NULL REFERENCES profiles(wallet_address),
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  page_url VARCHAR(255),
  device_type VARCHAR(50),
  device_os VARCHAR(50),
  browser VARCHAR(50),
  location_city VARCHAR(100),
  location_country VARCHAR(100),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indices for activity tracking
CREATE INDEX IF NOT EXISTS idx_user_activity_user_address ON user_activity(user_address);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_activity_type ON user_activity(activity_type);

-- Create spending_analysis view
CREATE OR REPLACE VIEW user_spending_analysis AS
SELECT 
  p.wallet_address,
  p.email,
  p.name,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(COALESCE(o.total_amount, 0)) as total_spent,
  AVG(COALESCE(o.total_amount, 0)) as avg_order_value,
  MAX(o.created_at) as last_purchase,
  p.city,
  p.country,
  p.device_type,
  p.browser,
  p.signup_date,
  p.last_login,
  CASE WHEN s.id IS NOT NULL THEN true ELSE false END as is_seller,
  LAG(SUM(COALESCE(o.total_amount, 0))) OVER (PARTITION BY p.wallet_address ORDER BY DATE_TRUNC('month', o.created_at)) as prev_month_spending
FROM profiles p
LEFT JOIN orders o ON p.wallet_address = o.user_address
LEFT JOIN stores s ON p.wallet_address = s.owner_address
GROUP BY p.wallet_address, p.email, p.name, p.city, p.country, p.device_type, p.browser, p.signup_date, p.last_login, s.id;

-- Create withdrawal tracking table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  amount DECIMAL(18, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  method VARCHAR(50),
  account_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create PAJ transaction table
CREATE TABLE IF NOT EXISTS paj_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address VARCHAR(255) NOT NULL REFERENCES profiles(wallet_address),
  amount DECIMAL(18, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  reference_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indices
CREATE INDEX IF NOT EXISTS idx_withdrawals_store_id ON withdrawals(store_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_paj_transactions_user_address ON paj_transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_paj_transactions_status ON paj_transactions(status);
