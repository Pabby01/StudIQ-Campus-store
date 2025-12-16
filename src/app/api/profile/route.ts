import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/profile?address=xxx - Get user profile
export async function GET(req: Request) {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    try {
        const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("address", address)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found (okay)
            console.error("Profile fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch profile" },
                { status: 500 }
            );
        }

        // Return profile or empty object if not found
        return NextResponse.json({
            profile: profile || {
                address,
                name: null,
                email: null,
                school: null,
                campus: null,
                level: null,
                phone: null,
                avatar_url: null,
                bio: null
            }
        });
    } catch (error) {
        console.error("Profile error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
