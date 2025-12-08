import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const featured = url.searchParams.get("featured") === "true";

        const supabase = getSupabaseServerClient();

        let query = supabase
            .from("stores")
            .select("*, profiles(name)")
            .order("created_at", { ascending: false })
            .limit(limit);

        // For featured stores, you could add additional filtering
        // For now, just get the most recent ones

        const { data, error } = await query;

        if (error) {
            console.error("Stores fetch error:", error);
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
        console.error("Stores fetch error:", error);
        return Response.json(
            { ok: false, error: "Server error" },
            { status: 500 }
        );
    }
}
