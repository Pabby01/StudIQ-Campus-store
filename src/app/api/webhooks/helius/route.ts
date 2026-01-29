import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// Helius sends an array of transactions
interface HeliusTx {
    signature: string;
    type: string;
    description: string;
    source: string;
    fee: number;
    feePayer: string;
    timestamp: number;
    nativeTransfers?: {
        fromUserAccount: string;
        toUserAccount: string;
        amount: number;
    }[];
    tokenTransfers?: {
        fromUserAccount: string;
        toUserAccount: string;
        mint: string;
        tokenAmount: number;
    }[];
}

export async function POST(req: Request) {
    try {
        // 1. Authenticate the request
        const authHeader = req.headers.get("Authorization");
        const configuredSecret = process.env.HELIUS_WEBHOOK_SECRET;

        if (configuredSecret && authHeader !== `Bearer ${configuredSecret}`) {
            console.error("[Helius Webhook] Unauthorized access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json() as HeliusTx[];

        // Helius sends an array of transactions
        if (!Array.isArray(payload)) {
            // Sometimes Helius sends a test ping or different structure
            console.log("[Helius Webhook] Received non-array payload:", payload);
            return NextResponse.json({ message: "Received" });
        }

        console.log(`[Helius Webhook] Received ${payload.length} transactions`);

        const supabase = getSupabaseServerClient();

        for (const tx of payload) {
            // Log the transaction or process it
            // For now, we'll just log "Native Transfers" related to the store

            if (tx.nativeTransfers) {
                for (const transfer of tx.nativeTransfers) {
                    console.log(`[Helius Webhook] Transfer: ${transfer.amount / 1e9} SOL from ${transfer.fromUserAccount} to ${transfer.toUserAccount}`);

                    // TODO: Here you could trigger "Order Completed" logic if the 'to' address is the platform wallet 
                    // and the amount matches a pending order.
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Helius Webhook] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
