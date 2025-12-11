-- Add images array column to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Migrate existing single image to array (one-time)
UPDATE products 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND (images IS NULL OR images = '{}');

-- Add comment
COMMENT ON COLUMN products.images IS 'Array of image URLs (max 10)';
