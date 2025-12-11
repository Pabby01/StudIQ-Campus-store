-- Drop the existing foreign key constraint
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE CASCADE;

-- Optional: Do the same for inventory_reservations if needed
ALTER TABLE inventory_reservations
DROP CONSTRAINT IF EXISTS inventory_reservations_product_id_fkey;

ALTER TABLE inventory_reservations
ADD CONSTRAINT inventory_reservations_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE CASCADE;
