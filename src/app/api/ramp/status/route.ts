/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: "Transaction id is required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        const { data, error } = await supabase
            .from('ramp_transactions')
            .select('status, tx_signature, fiat_amount, crypto_amount, type')
            .eq('paj_id', id)
            .maybeSingle();

        if (error) {
            console.error("[PAJ Ramp] Status lookup failed:", error);
            return NextResponse.json({ success: false, error: "Failed to lookup transaction" }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, transaction: data });
    } catch (error: any) {
        console.error("[PAJ Ramp] Status endpoint error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Status check failed"
        }, { status: 500 });
    }
}

