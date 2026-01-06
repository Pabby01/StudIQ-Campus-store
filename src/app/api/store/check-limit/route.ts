import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { canCreateStore } from "@/lib/storeLimit";

// Helper to resolve email to wallet address
async function resolveAddress(addressOrEmail: string): Promise<string | null> {
    if (addressOrEmail.startsWith("email:")) {
        const email = addressOrEmail.replace("email:", "");
        const supabase = getSupabaseServerClient();
        const { data: profile } = await supabase
            .from("profiles")
            .select("address")
            .eq("email", email)
            .maybeSingle();
        return profile?.address || null;
    }
    return addressOrEmail;
}

// GET /api/store/check-limit?address=xxx
// address can be a wallet address or "email:xxx" format
export async function GET(req: Request) {
    const url = new URL(req.url);
    const addressParam = url.searchParams.get("address");

    if (!addressParam) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    try {
        const address = await resolveAddress(addressParam);

        if (!address) {
            // No profile, return free tier limits
            return NextResponse.json({
                allowed: true,
                currentCount: 0,
                maxStores: 1,
                planName: 'Free',
                percentage: 0
            });
        }

        const limitInfo = await canCreateStore(address);
        return NextResponse.json(limitInfo);
    } catch (error) {
        console.error("Store limit check error:", error);
        return NextResponse.json(
            { error: "Failed to check store limit" },
            { status: 500 }
        );
    }
}
