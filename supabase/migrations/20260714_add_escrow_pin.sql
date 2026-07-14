-- Add escrow_pin to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_pin text;
