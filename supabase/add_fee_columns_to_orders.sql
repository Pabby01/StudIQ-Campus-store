-- Add platform fee columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS seller_payout DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,4);
