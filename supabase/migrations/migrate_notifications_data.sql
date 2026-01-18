-- Data Migration: Convert notification user_ids from Profile UUIDs to Wallet Addresses
-- Run this in Supabase SQL Editor

UPDATE notifications n
SET user_id = p.address
FROM profiles p
WHERE n.user_id = p.id::text;

-- Verify the update
SELECT COUNT(*) as fixed_notifications 
FROM notifications 
WHERE user_id ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'; -- Basic regex for Solana address
