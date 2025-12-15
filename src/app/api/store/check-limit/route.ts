import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { canCreateStore } from "@/lib/storeLimit";

// GET /api/store/check-limit?address=xxx
export async function GET(req: Request) {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    try {
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
