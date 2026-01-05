import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { exists: false, error: "Email parameter required" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        // Check if profile exists with this email
        const { data, error } = await supabase
            .from("profiles")
            .select("address, email, name, civic_user_id")
            .eq("email", email)
            .single();

        if (error) {
            // Profile doesn't exist
            if (error.code === "PGRST116") {
                return NextResponse.json({ exists: false });
            }

            console.error("[Profile Check] Database error:", error);
            return NextResponse.json(
                { exists: false, error: "Database error" },
                { status: 500 }
            );
        }

        // Profile exists
        return NextResponse.json({
            exists: true,
            profile: data,
        });
    } catch (error) {
        console.error("[Profile Check] Error:", error);
        return NextResponse.json(
            { exists: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
