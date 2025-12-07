import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWalletFromReq } from "@/lib/session";
import { APIError, handleAPIError } from "@/lib/errors";

export async function GET(req: Request) {
    try {
        const address = getSessionWalletFromReq(req);
        if (!address) {
            throw new APIError(401, "UNAUTHORIZED", "Authentication required");
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "";
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
        const offset = parseInt(searchParams.get("offset") || "0");

        const supabase = getSupabaseServerClient();

        let query = supabase
            .from("orders")
            .select(
                `
        *,
        stores(name),
        order_items(*, products(name, image_url))
      `,
                { count: "exact" }
            )
            .eq("buyer_address", address)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq("status", status);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error("Orders fetch error:", error);
            throw new APIError(500, "FETCH_FAILED", "Failed to fetch orders");
        }

        return Response.json({
            ok: true,
            orders: data || [],
            total: count || 0,
            limit,
            offset,
            hasMore: (count || 0) > offset + limit,
        });
    } catch (error) {
        return handleAPIError(error);
    }
}
