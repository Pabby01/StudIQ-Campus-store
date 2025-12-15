import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/subscription/plans - Get all available subscription plans
export async function GET() {
    const supabase = getSupabaseServerClient();

    try {
        const { data: plans, error } = await supabase
            .from("subscription_plans")
            .select("*")
            .eq("is_active", true)
            .order("price_usd", { ascending: true });

        if (error) {
            console.error("Error fetching plans:", error);
            return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
        }

        return NextResponse.json({ plans });
    } catch (error) {
        console.error("Subscription plans error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
