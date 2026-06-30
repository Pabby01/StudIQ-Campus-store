-- 1. Seal Transaction Replay Leaks
ALTER TABLE orders ADD CONSTRAINT unique_tx_sig UNIQUE (tx_sig);

-- 2. Database Indexing (Performance Optimization)
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_address);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
