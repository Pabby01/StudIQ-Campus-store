-- Add featured stores support
ALTER TABLE stores ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS featured_order integer DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS featured_at timestamptz DEFAULT NULL;

-- Add analytics tracking for users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_range text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_date timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_agent text;

-- Track product views
CREATE TABLE IF NOT EXISTS product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_address text REFERENCES profiles(address) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now(),
  session_id text
);

-- Track user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address text REFERENCES profiles(address) ON DELETE CASCADE,
  session_id text NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  device_type text,
  user_agent text
);

-- Analytics summary table for fast dashboard queries
CREATE TABLE IF NOT EXISTS analytics_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  total_users int DEFAULT 0,
  new_users int DEFAULT 0,
  total_orders int DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  avg_order_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user_address ON product_views(user_address);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_address ON user_sessions(user_address);
CREATE INDEX IF NOT EXISTS idx_stores_featured ON stores(featured);
CREATE INDEX IF NOT EXISTS idx_stores_featured_order ON stores(featured_order);
