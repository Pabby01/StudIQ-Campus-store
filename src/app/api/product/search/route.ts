import { getSupabaseServerClient } from "@/lib/supabase";
import { sanitizeSearchQuery } from "@/lib/sanitize";
import { APIError, handleAPIError } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const order = searchParams.get("order") || "desc";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const storeId = searchParams.get("storeId");

    const supabase = getSupabaseServerClient();

    // Build query
    let dbQuery = supabase
      .from("products")
      .select("*, stores(name, category)", { count: "exact" });

    // Store filter
    if (storeId) {
      dbQuery = dbQuery.eq("store_id", storeId);
    }

    // Search filter
    if (query) {
      const sanitized = sanitizeSearchQuery(query);
      dbQuery = dbQuery.or(
        `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
      );
    }

    // Category filter
    if (category) {
      dbQuery = dbQuery.eq("category", category);
    }

    // Price range filter
    dbQuery = dbQuery.gte("price", minPrice).lte("price", maxPrice);

    // Sorting
    const validSortFields = ["price", "created_at", "name", "rating"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
    dbQuery = dbQuery.order(sortField, { ascending: order === "asc" });

    // Pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error("Search error:", error);
      throw new APIError(500, "SEARCH_FAILED", "Failed to search products");
    }

    return Response.json({
      ok: true,
      products: data || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
