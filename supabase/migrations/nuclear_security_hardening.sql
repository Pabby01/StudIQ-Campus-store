-- NUCLEAR SECURITY HARDENING
-- This script replaces all existing RLS policies with secure, session-backed ones.

-- 1. Create a helper function to get current user address from session
CREATE OR REPLACE FUNCTION get_session_user()
RETURNS TEXT AS $$
DECLARE
    user_addr TEXT;
BEGIN
    SELECT user_address INTO user_addr
    FROM secure_sessions
    WHERE id::text = current_setting('request.header.x-session-id', true)
    AND expires_at > NOW();
    
    RETURN user_addr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Secure Profiles Table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "profiles_read_self" ON profiles;

CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE 
USING (address = get_session_user())
WITH CHECK (address = get_session_user());

-- 3. Secure Stores Table
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stores_select" ON stores;
DROP POLICY IF EXISTS "stores_modify_owner" ON stores;
DROP POLICY IF EXISTS "stores_update_owner" ON stores;

CREATE POLICY "stores_select_public" ON stores FOR SELECT USING (true);
CREATE POLICY "stores_insert_own" ON stores FOR INSERT WITH CHECK (owner_address = get_session_user());
CREATE POLICY "stores_update_own" ON stores FOR UPDATE USING (owner_address = get_session_user());

-- 4. Secure Products Table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_modify_owner" ON products;
DROP POLICY IF EXISTS "products_update_owner" ON products;

CREATE POLICY "products_select_public" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert_own" ON products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_address = get_session_user())
);
CREATE POLICY "products_update_own" ON products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_address = get_session_user())
);

-- 5. Secure Orders Table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_select_self" ON orders;
DROP POLICY IF EXISTS "orders_insert_self" ON orders;

CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (
  buyer_address = get_session_user() OR 
  EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_address = get_session_user())
);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (buyer_address = get_session_user());

-- 6. Secure Points Log Table
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "points_log_select_own" ON points_log;
CREATE POLICY "points_log_select_own" ON points_log FOR SELECT USING (address = get_session_user());

-- 7. Secure Wishlists Table
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wishlists_all_self" ON wishlists;
CREATE POLICY "wishlists_all_self" ON wishlists USING (address = get_session_user());

-- 8. INTEGRITY: Sync points to profile automatically
CREATE OR REPLACE FUNCTION sync_profile_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET points = (SELECT COALESCE(SUM(points), 0) FROM points_log WHERE address = NEW.address)
    WHERE address = NEW.address;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_points ON points_log;
CREATE TRIGGER trg_sync_points
AFTER INSERT OR UPDATE OR DELETE ON points_log
FOR EACH ROW EXECUTE FUNCTION sync_profile_points();

-- 9. Secure the sessions table itself
ALTER TABLE secure_sessions ENABLE ROW LEVEL SECURITY;
-- No public access to sessions table. Only service role can manage it.
