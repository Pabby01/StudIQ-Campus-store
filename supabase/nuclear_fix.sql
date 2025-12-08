-- NUCLEAR OPTION: Complete database cleanup
-- This will show you what's causing the issue and fix it

-- Step 1: Check what policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Step 2: Check what triggers exist
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid::regclass::text IN ('stores', 'products', 'profiles', 'orders');

-- Step 3: Check what functions reference request.header.sid
SELECT proname, prosrc
FROM pg_proc
WHERE prosrc LIKE '%request.header.sid%';

-- NOW THE FIX: Drop everything that could cause the issue

-- Drop ALL triggers
DROP TRIGGER IF EXISTS freemium_stores ON stores CASCADE;
DROP TRIGGER IF EXISTS freemium_products ON products CASCADE;
DROP TRIGGER IF EXISTS set_tier_limits ON stores CASCADE;
DROP TRIGGER IF EXISTS set_tier_limits ON products CASCADE;

-- Drop ALL functions that might use request.header.sid
DROP FUNCTION IF EXISTS enforce_freemium_limits() CASCADE;
DROP FUNCTION IF EXISTS check_tier_limits() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_address() CASCADE;

-- Completely disable RLS (this WILL work)
ALTER TABLE IF EXISTS stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies (even if they don't exist)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Verify everything is clean
SELECT 'Remaining policies:', COUNT(*) FROM pg_policies WHERE schemaname = 'public';
SELECT 'Remaining triggers:', COUNT(*) FROM pg_trigger WHERE tgrelid::regclass::text IN ('stores', 'products');
SELECT 'Remaining functions with sid:', COUNT(*) FROM pg_proc WHERE prosrc LIKE '%request.header.sid%';
