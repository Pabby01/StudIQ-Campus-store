import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const { email, walletAddress, civicUserId } = await req.json();

        if (!email || !walletAddress) {
            return Response.json(
                { ok: false, error: "Email and wallet address required" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        // Find profile by email or civic_user_id and update wallet address
        const { data, error } = await supabase
            .from("profiles")
            .update({
                address: walletAddress,
                last_login: new Date().toISOString(),
            })
            .or(`email.eq.${email},civic_user_id.eq.${civicUserId || 'null'}`)
            .select()
            .single();

        if (error) {
            console.error("Update wallet error:", error);

            // If profile not found, try to update by any placeholder address
            const { data: placeholderUpdate, error: placeholderError } = await supabase
                .from("profiles")
                .update({
                    address: walletAddress,
                    last_login: new Date().toISOString(),
                })
                .eq("email", email)
                .select()
                .single();

            if (placeholderError) {
                return Response.json(
                    { ok: false, error: "Failed to update wallet address" },
                    { status: 500 }
                );
            }

            return Response.json({ ok: true, profile: placeholderUpdate });
        }

        return Response.json({ ok: true, profile: data });
    } catch (error) {
        console.error("Update wallet error:", error);
        return Response.json(
            { ok: false, error: "Server error" },
            { status: 500 }
        );
    }
}
