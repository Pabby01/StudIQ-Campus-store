import { getSupabaseServerClient } from './supabase';
import { sendPushNotification } from './push';

export interface NotificationPayload {
    user_id: string; // Wallet address
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    url?: string;
}

/**
 * Centrally triggers both an in-app notification and a push notification
 */
export async function triggerNotification(payload: NotificationPayload) {
    try {
        const supabase = getSupabaseServerClient();

        console.log(`[Notification] Triggering for ${payload.user_id}: ${payload.title}`);

        // 1. In-App Notification (Database)
        const { error: dbError } = await supabase
            .from('notifications')
            .insert({
                user_id: payload.user_id,
                title: payload.title,
                message: payload.message,
                type: payload.type,
                read: false,
                created_at: new Date().toISOString()
            });

        if (dbError) {
            console.error('[Notification] Database insert failed:', dbError);
        }

        // 2. Push Notification
        await sendPushNotification(
            payload.user_id,
            payload.title,
            payload.message,
            payload.url
        );

        return { ok: true };
    } catch (error) {
        console.error('[Notification] Global trigger error:', error);
        return { ok: false, error };
    }
}
