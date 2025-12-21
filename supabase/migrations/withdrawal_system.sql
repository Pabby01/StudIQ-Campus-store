-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_address TEXT NOT NULL REFERENCES profiles(address),
  amount DECIMAL(20, 9) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SOL',
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status: 'pending' | 'processing' | 'completed' | 'rejected'
  
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  order_ids TEXT[] NOT NULL,
  -- Array of order IDs included in this withdrawal
  
  transaction_signature TEXT,
  -- Solana transaction signature when paid
  
  notes TEXT,
  -- Admin notes or rejection reason
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_seller ON withdrawal_requests(seller_address);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requested ON withdrawal_requests(requested_at);

-- Add withdrawal tracking to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS withdrawn BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS withdrawal_id UUID REFERENCES withdrawal_requests(id);

-- Create index on orders for withdrawal queries
CREATE INDEX IF NOT EXISTS idx_orders_withdrawn ON orders(withdrawn);
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON orders(store_id, status);

-- Create function to calculate seller earnings
CREATE OR REPLACE FUNCTION get_seller_earnings(p_seller_address TEXT)
RETURNS TABLE (
  total_orders BIGINT,
  completed_orders BIGINT,
  total_revenue DECIMAL,
  platform_fee DECIMAL,
  seller_share DECIMAL,
  withdrawn DECIMAL,
  pending_withdrawals DECIMAL,
  available DECIMAL,
  currency TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH seller_stores AS (
    SELECT id FROM stores WHERE owner_address = p_seller_address
  ),
  completed_order_stats AS (
    SELECT 
      COUNT(*) as total_completed,
      COALESCE(SUM(amount), 0) as total_amount,
      currency
    FROM orders
    WHERE store_id IN (SELECT id FROM seller_stores)
      AND status = 'completed'
    GROUP BY currency
  ),
  withdrawn_stats AS (
    SELECT 
      COALESCE(SUM(amount), 0) as total_withdrawn,
      currency
    FROM withdrawal_requests
    WHERE seller_address = p_seller_address
      AND status = 'completed'
    GROUP BY currency
  ),
  pending_stats AS (
    SELECT 
      COALESCE(SUM(amount), 0) as total_pending,
      currency
    FROM withdrawal_requests
    WHERE seller_address = p_seller_address
      AND status IN ('pending', 'processing')
    GROUP BY currency
  ),
  all_orders AS (
    SELECT COUNT(*) as total
    FROM orders
    WHERE store_id IN (SELECT id FROM seller_stores)
  )
  SELECT 
    (SELECT total FROM all_orders),
    co.total_completed,
    co.total_amount,
    (co.total_amount * 0.05), -- 5% platform fee
    (co.total_amount * 0.95), -- 95% seller share
    COALESCE(w.total_withdrawn, 0),
    COALESCE(p.total_pending, 0),
    (co.total_amount * 0.95) - COALESCE(w.total_withdrawn, 0) - COALESCE(p.total_pending, 0),
    co.currency
  FROM completed_order_stats co
  LEFT JOIN withdrawn_stats w ON w.currency = co.currency
  LEFT JOIN pending_stats p ON p.currency = co.currency;
END;
$$ LANGUAGE plpgsql;

-- Comment on tables and columns
COMMENT ON TABLE withdrawal_requests IS 'Tracks seller withdrawal requests and their processing status';
COMMENT ON COLUMN withdrawal_requests.status IS 'pending: awaiting processing, processing: being processed, completed: funds sent, rejected: request denied';
COMMENT ON COLUMN orders.withdrawn IS 'Indicates if this order''s funds have been withdrawn by seller';
COMMENT ON FUNCTION get_seller_earnings IS 'Calculates total earnings, fees, and available balance for a seller';
