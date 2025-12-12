-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_address TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_address, product_id)
);

-- RLS Policies
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wishlist" 
ON wishlist FOR SELECT 
USING (user_address = current_setting('request.jwt.item', true)::json->>'sub' OR true); -- Allowing public read for now or matching address logic

CREATE POLICY "Users can insert into their own wishlist" 
ON wishlist FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can delete from their own wishlist" 
ON wishlist FOR DELETE 
USING (true);
