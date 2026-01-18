import webpush from 'web-push';
import { getSupabaseServerClient } from './supabase';

// Configure VAPID
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@studiq.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

export async function sendPushNotification(userAddress: string, title: string, body: string, url: string = '/') {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn('[Push] VAPID keys not configured. Skipping push notification.');
        return;
    }

    try {
        const supabase = getSupabaseServerClient();

        // Get all subscriptions for this user
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_address', userAddress);

        if (error || !subscriptions || subscriptions.length === 0) {
            console.log(`[Push] No subscriptions found for user ${userAddress}`);
            return;
        }

        console.log(`[Push] Sending push to ${subscriptions.length} subscriptions for ${userAddress}`);

        const payload = JSON.stringify({
            title,
            body,
            url
        });

        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                };

                return webpush.sendNotification(pushSubscription, payload);
            })
        );

        // Handle expired subscriptions
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'rejected') {
                const sub = subscriptions[i];
                // If 410 (Gone) or 404 (Not Found), delete the subscription
                if ((result.reason as any).statusCode === 410 || (result.reason as any).statusCode === 404) {
                    console.log(`[Push] Deleting expired subscription: ${sub.id}`);
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                } else {
                    console.error(`[Push] Error sending to ${sub.endpoint}:`, result.reason);
                }
            }
        }

    } catch (error) {
        console.error('[Push] Unexpected error:', error);
    }
}
