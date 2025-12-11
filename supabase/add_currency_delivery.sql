-- Add currency to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SOL';

-- Add delivery and currency columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SOL',
ADD COLUMN IF NOT EXISTS delivery_method TEXT CHECK (delivery_method IN ('shipping', 'pickup')),
ADD COLUMN IF NOT EXISTS delivery_info JSONB;

-- Add comments for clarity
COMMENT ON COLUMN products.currency IS 'Currency used for pricing (SOL or USDC)';
COMMENT ON COLUMN orders.delivery_method IS 'shipping or pickup';
COMMENT ON COLUMN orders.delivery_info IS 'JSON object containing name, address, city, zip';
