import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const address = url.searchParams.get("address");

        if (!address) {
            return Response.json(
                { ok: false, error: "Wallet address required" },
                { status: 401 }
            );
        }

        const supabase = getSupabaseServerClient();

        const { data, error } = await supabase
            .from("stores")
            .select("*")
            .eq("owner_address", address)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Store list error:", error);
            return Response.json(
                { ok: false, error: "Failed to fetch stores" },
                { status: 500 }
            );
        }

        return Response.json({
            ok: true,
            stores: data || [],
        });
    } catch (error) {
        console.error("Store list error:", error);
        return Response.json(
            { ok: false, error: "Server error" },
            { status: 500 }
        );
    }
}
