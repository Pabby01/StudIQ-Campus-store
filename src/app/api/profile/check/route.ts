import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";
import { verifyCivicToken } from "@/lib/civic-verify";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const address = searchParams.get("address");
        const civicId = searchParams.get("civicId");

        // Accept Civic token from Authorization header (not URL — avoid logging tokens)
        const authHeader = req.headers.get("Authorization");
        const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const isApiKeyValid = authHeader === `Bearer ${process.env.SYNC_API_KEY}`;

        // Security: allow if session cookie, API key, OR valid Civic bearer token
        const sessionAddress = await getSessionWallet(req);

        let isCivicValid = false;
        if (bearerToken && !isApiKeyValid) {
            const civic = await verifyCivicToken(bearerToken);
            if (civic.success) isCivicValid = true;
        }

        if (!sessionAddress && !isApiKeyValid && !isCivicValid) {
            return NextResponse.json({ exists: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!email && !address && !civicId) {
            return NextResponse.json(
                { exists: false, error: "At least one of email, address, or civicId is required" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        // Try lookups in priority order: email → wallet address → civic_user_id
        let data: { address: string; email: string | null; name: string | null; civic_user_id: string | null; school: string | null; campus: string | null } | null = null;

        if (email) {
            const res = await supabase
                .from("profiles")
                .select("address, email, name, civic_user_id, school, campus")
                .eq("email", email)
                .maybeSingle();
            data = res.data;
        }

        if (!data && address) {
            const res = await supabase
                .from("profiles")
                .select("address, email, name, civic_user_id, school, campus")
                .eq("address", address)
                .maybeSingle();
            data = res.data;
        }

        if (!data && civicId) {
            const res = await supabase
                .from("profiles")
                .select("address, email, name, civic_user_id, school, campus")
                .eq("civic_user_id", civicId)
                .maybeSingle();
            data = res.data;
        }

        if (!data) {
            return NextResponse.json({ exists: false, isComplete: false });
        }

        // A profile is considered complete when it has the three core fields
        const isComplete = !!(data.name && data.school && data.campus);

        return NextResponse.json({
            exists: true,
            isComplete,
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
