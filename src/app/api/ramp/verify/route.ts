import { verify } from 'paj_ramp';
import { PAJ_CONFIG } from '@/lib/paj';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { identifier, otp, deviceInfo } = await req.json();

        if (!identifier || !otp) {
            return NextResponse.json({ error: "Identifier and OTP are required" }, { status: 400 });
        }

        console.log(`[PAJ Ramp] Verifying OTP for: ${identifier}`);

        // deviceInfo should include uuid, device, os, browser, ip
        const response = await verify(
            identifier,
            otp,
            deviceInfo || {
                uuid: "123e4567-e89b-12d3-a456-426614174000",
                device: "desktop",
                os: "windows",
                browser: "Chrome",
                ip: "127.0.0.1"
            },
            PAJ_CONFIG.apiKey
        );

        return NextResponse.json({ success: true, response });
    } catch (error: any) {
        console.error("[PAJ Ramp] Verification failed:", error);
        return NextResponse.json({
            error: error.message || "Failed to verify OTP"
        }, { status: 500 });
    }
}
