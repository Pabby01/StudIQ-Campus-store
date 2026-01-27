import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        console.log("[PAJ Webhook] Received update:", payload);

        const { id, status, signature, amount, fiatAmount, transactionType } = payload;

        const supabase = getSupabaseServerClient();

        // Update transaction in database
        const { error } = await supabase
            .from('ramp_transactions')
            .update({
                status: status,
                tx_signature: signature,
                crypto_amount: amount,
                fiat_amount: fiatAmount,
                updated_at: new Date().toISOString()
            })
            .eq('paj_id', id);

        if (error) {
            console.error("[PAJ Webhook] DB Update failed:", error);
            // Even if DB fails, return 200 to PAJ to acknowledge receipt
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[PAJ Webhook] Error processing webhook:", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}
