import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const address = await getSessionWallet(req);
        if (!address) {
            return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const { subscription } = await req.json();
        const { endpoint, keys } = subscription;
        const userAddress = address;

        if (!userAddress || !endpoint || !keys) {
            return Response.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Check if subscription already exists to avoid duplicates
        // Note: We use upsert on endpoint + user_address or just insert
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_address: userAddress,
                endpoint: endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_address, endpoint' });

        if (error) {
            console.error('Failed to save subscription:', error);
            return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        return Response.json({ ok: true });
    } catch (error) {
        console.error('Subscription API Error:', error);
        return Response.json({ ok: false, error: 'Internal error' }, { status: 500 });
    }
}
