-- Add inventory column to products if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory INTEGER DEFAULT 0;

-- Create inventory_reservations table
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reserved_by TEXT NOT NULL,
  order_id UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product ON inventory_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_expires ON inventory_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order ON inventory_reservations(order_id);

-- Function to release expired reservations
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS void AS $$
BEGIN
  DELETE FROM inventory_reservations
  WHERE expires_at < NOW() AND order_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check available inventory
CREATE OR REPLACE FUNCTION get_available_inventory(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_inventory INTEGER;
  reserved_quantity INTEGER;
BEGIN
  -- Get total inventory
  SELECT inventory INTO total_inventory
  FROM products
  WHERE id = p_product_id;

  -- Get currently reserved quantity (excluding expired)
  SELECT COALESCE(SUM(quantity), 0) INTO reserved_quantity
  FROM inventory_reservations
  WHERE product_id = p_product_id
    AND expires_at > NOW();

  RETURN GREATEST(total_inventory - reserved_quantity, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to reserve inventory
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id UUID,
  p_quantity INTEGER,
  p_reserved_by TEXT,
  p_minutes INTEGER DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
  available INTEGER;
  reservation_id UUID;
BEGIN
  -- Clean up expired reservations first
  PERFORM release_expired_reservations();

  -- Check available inventory
  available := get_available_inventory(p_product_id);

  IF available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %', available, p_quantity;
  END IF;

  -- Create reservation
  INSERT INTO inventory_reservations (product_id, quantity, reserved_by, expires_at)
  VALUES (
    p_product_id,
    p_quantity,
    p_reserved_by,
    NOW() + (p_minutes || ' minutes')::INTERVAL
  )
  RETURNING id INTO reservation_id;

  RETURN reservation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm reservation (link to order)
CREATE OR REPLACE FUNCTION confirm_reservation(
  p_reservation_id UUID,
  p_order_id UUID
)
RETURNS void AS $$
DECLARE
  v_product_id UUID;
  v_quantity INTEGER;
BEGIN
  -- Get reservation details
  SELECT product_id, quantity INTO v_product_id, v_quantity
  FROM inventory_reservations
  WHERE id = p_reservation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  -- Update reservation with order_id
  UPDATE inventory_reservations
  SET order_id = p_order_id
  WHERE id = p_reservation_id;

  -- Decrement actual inventory
  UPDATE products
  SET inventory = inventory - v_quantity
  WHERE id = v_product_id;

  -- Delete the reservation (it's now part of an order)
  DELETE FROM inventory_reservations
  WHERE id = p_reservation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to release reservation
CREATE OR REPLACE FUNCTION release_reservation(p_reservation_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM inventory_reservations
  WHERE id = p_reservation_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-release expired reservations (runs every minute)
-- Note: This requires pg_cron extension. Alternative: run via cron job or API endpoint
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('release-expired-reservations', '* * * * *', 'SELECT release_expired_reservations()');
