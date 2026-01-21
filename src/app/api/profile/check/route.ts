import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";
import { verifyCivicToken } from "@/lib/civic-verify";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const token = searchParams.get("token");

        // Security Check
        const sessionAddress = await getSessionWallet(req);
        const authHeader = req.headers.get("Authorization");
        const isApiKeyValid = authHeader === `Bearer ${process.env.SYNC_API_KEY}`;

        // Also allow if a valid Civic token is provided
        let isCivicValid = false;
        if (token) {
            const civic = await verifyCivicToken(token);
            if (civic.success) isCivicValid = true;
        }

        if (!sessionAddress && !isApiKeyValid && !isCivicValid) {
            return NextResponse.json({ exists: false, error: "Unauthorized" }, { status: 401 });
        }

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
