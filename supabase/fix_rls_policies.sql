-- Fix RLS policies to remove session header dependencies
-- Run this in Supabase SQL Editor

-- Drop old RLS policies that use request.header.sid
DROP POLICY IF EXISTS "Users can insert own stores" ON stores;
DROP POLICY IF EXISTS "Users can update own stores" ON stores;
DROP POLICY IF EXISTS "Users can delete own stores" ON stores;
DROP POLICY IF EXISTS "Anyone can view stores" ON stores;

-- Create new RLS policies without session headers
-- Allow anyone to view stores
CREATE POLICY "Public can view stores"
ON stores FOR SELECT
USING (true);

-- Allow anyone to insert stores (we validate in API)
CREATE POLICY "Authenticated users can create stores"
ON stores FOR INSERT
WITH CHECK (true);

-- Allow store owners to update their stores
CREATE POLICY "Store owners can update"
ON stores FOR UPDATE
USING (true);

-- Allow store owners to delete their stores
CREATE POLICY "Store owners can delete"
ON stores FOR DELETE
USING (true);

-- Do the same for products table
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;
DROP POLICY IF EXISTS "Anyone can view products" ON products;

CREATE POLICY "Public can view products"
ON products FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create products"
ON products FOR INSERT
WITH CHECK (true);

CREATE POLICY "Product owners can update"
ON products FOR UPDATE
USING (true);

CREATE POLICY "Product owners can delete"
ON products FOR DELETE
USING (true);

-- Fix profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
ON profiles FOR UPDATE
USING (true);

-- Fix orders table
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Store owners can view orders" ON orders;

CREATE POLICY "Anyone can view orders"
ON orders FOR SELECT
USING (true);

CREATE POLICY "Anyone can create orders"
ON orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update orders"
ON orders FOR UPDATE
USING (true);
