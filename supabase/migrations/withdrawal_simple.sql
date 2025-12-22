-- Simple withdrawal system setup (no complex functions needed)

-- Create withdrawal_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_address TEXT NOT NULL,
  amount DECIMAL(20, 9) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SOL',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  order_ids TEXT[] NOT NULL,
  transaction_signature TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_seller ON withdrawal_requests(seller_address);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status);

-- Add withdrawal tracking columns to orders if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='withdrawn') 
  THEN
    ALTER TABLE orders ADD COLUMN withdrawn BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='withdrawal_id') 
  THEN
    ALTER TABLE orders ADD COLUMN withdrawal_id UUID;
  END IF;
END $$;

-- Create index on orders
CREATE INDEX IF NOT EXISTS idx_orders_withdrawn ON orders(withdrawn);
