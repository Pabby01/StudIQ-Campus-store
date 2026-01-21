import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/session";

// GET /api/profile?address=xxx - Get user profile
// address can be a wallet address or "email:xxx" format
export async function GET(req: Request) {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    // Security Check
    const sessionAddress = await getSessionWallet(req);
    const authHeader = req.headers.get("Authorization");
    const isApiKeyValid = authHeader === `Bearer ${process.env.SYNC_API_KEY}`;

    if (!address) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    // Allow if it's the user's own profile OR if it's an internal API call
    const isOwnProfile = sessionAddress && (
        address === sessionAddress ||
        (address.startsWith("email:") && address.replace("email:", "") === sessionAddress) // This part is tricky if email isn't address
    );

    if (!isOwnProfile && !isApiKeyValid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    try {
        let query = supabase.from("profiles").select("*");

        // Check if address is in email:xxx format
        if (address.startsWith("email:")) {
            const email = address.replace("email:", "");
            query = query.eq("email", email);
        } else {
            query = query.eq("address", address);
        }

        const { data: profile, error } = await query.maybeSingle();

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
