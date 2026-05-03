-- Create inventory_alerts table for Inventory Alerts feature
-- Sellers can set thresholds and get notified when stock is low

CREATE TABLE IF NOT EXISTS inventory_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  threshold integer NOT NULL,
  current_inventory integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(store_id, product_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_inventory_alerts_store_id ON inventory_alerts(store_id);
CREATE INDEX idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX idx_inventory_alerts_is_active ON inventory_alerts(is_active);

-- Enable RLS
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Sellers can view their own store's alerts
CREATE POLICY "Sellers can view their store's inventory alerts"
  ON inventory_alerts FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_address = auth.jwt() ->> 'sub'
    )
  );

-- RLS Policy: Sellers can insert alerts for their store
CREATE POLICY "Sellers can create inventory alerts for their store"
  ON inventory_alerts FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE owner_address = auth.jwt() ->> 'sub'
    )
  );

-- RLS Policy: Sellers can update their own alerts
CREATE POLICY "Sellers can update their inventory alerts"
  ON inventory_alerts FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_address = auth.jwt() ->> 'sub'
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE owner_address = auth.jwt() ->> 'sub'
    )
  );

-- RLS Policy: Sellers can delete their own alerts
CREATE POLICY "Sellers can delete their inventory alerts"
  ON inventory_alerts FOR DELETE
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_address = auth.jwt() ->> 'sub'
    )
  );

-- Add comment
COMMENT ON TABLE inventory_alerts IS 'Stores inventory alerts set by sellers to track low stock';
