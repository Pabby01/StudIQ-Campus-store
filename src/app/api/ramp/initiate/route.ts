import { initiate } from 'paj_ramp';
import { PAJ_CONFIG } from '@/lib/paj';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { identifier } = await req.json();

        if (!identifier) {
            return NextResponse.json({ error: "Email or phone number is required" }, { status: 400 });
        }

        console.log(`[PAJ Ramp] Initiating verification for: ${identifier}`);
        const response = await initiate(identifier, PAJ_CONFIG.apiKey);

        return NextResponse.json({ success: true, response });
    } catch (error: any) {
        console.error("[PAJ Ramp] Initiation failed:", error);
        return NextResponse.json({
            error: error.message || "Failed to initiate verification"
        }, { status: 500 });
    }
}
