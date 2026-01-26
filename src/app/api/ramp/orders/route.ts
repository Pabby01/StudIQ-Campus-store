import { createOnrampOrder, createOfframpOrder, Currency } from 'paj_ramp';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, token, data } = body;

        if (!token) {
            return NextResponse.json({ error: "Session token is required" }, { status: 401 });
        }

        const supabase = getSupabaseServerClient();

        if (type === 'onramp') {
            console.log("[PAJ Ramp] Creating onramp order");
            const order = await createOnrampOrder(
                {
                    fiatAmount: data.fiatAmount,
                    currency: (data.currency || 'NGN') as Currency,
                    recipient: data.recipient,
                    mint: data.mint,
                    chain: data.chain || 'SOLANA',
                    webhookURL: data.webhookURL,
                },
                token
            );

            // Log transaction to database
            await supabase.from('ramp_transactions').insert({
                paj_id: order.id,
                user_address: data.recipient,
                type: 'onramp',
                fiat_amount: data.fiatAmount,
                currency: data.currency || 'NGN',
                status: 'INIT',
                mint: data.mint
            });

            return NextResponse.json({ success: true, order });
        } else if (type === 'offramp') {
            console.log("[PAJ Ramp] Creating offramp order");
            const order = await createOfframpOrder(
                {
                    bank: data.bankId,
                    accountNumber: data.accountNumber,
                    currency: (data.currency || 'NGN') as Currency,
                    amount: data.amount,
                    mint: data.mint,
                    webhookURL: data.webhookURL,
                },
                token
            );

            // Log transaction to database
            await supabase.from('ramp_transactions').insert({
                paj_id: order.id,
                user_address: order.address, // Correct field for user wallet in offramp
                type: 'offramp',
                fiat_amount: order.fiatAmount,
                currency: order.currency || 'NGN',
                status: 'INIT',
                mint: data.mint
            });

            return NextResponse.json({ success: true, order });
        }

        return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    } catch (error: any) {
        console.error("[PAJ Ramp] Order creation failed:", error);
        return NextResponse.json({
            error: error.message || "Order creation failed"
        }, { status: 500 });
    }
}
