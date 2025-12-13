-- Add tx_signature column to orders table for storing blockchain transaction signatures

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tx_signature TEXT;

-- Add index for faster lookups by transaction signature
CREATE INDEX IF NOT EXISTS idx_orders_tx_signature ON orders(tx_signature);

-- Add comment
COMMENT ON COLUMN orders.tx_signature IS 'Blockchain transaction signature for crypto payments';
