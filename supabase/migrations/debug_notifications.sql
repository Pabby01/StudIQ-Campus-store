-- Test query to check existing notifications
-- Run this in Supabase SQL Editor to see what's in the table

SELECT 
    id,
    user_id,
    title,
    message,
    type,
    read,
    created_at,
    LENGTH(user_id) as user_id_length,
    pg_typeof(user_id) as user_id_type
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- If you see notifications but user_id is NULL or empty, run this to check:
SELECT COUNT(*) as total_notifications FROM notifications;
SELECT COUNT(*) as notifications_with_user_id FROM notifications WHERE user_id IS NOT NULL AND user_id != '';
