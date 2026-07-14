import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    let query = supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: stores, error, count } = await query;

    if (error) throw error;

    // Enrich store data with owner and stats
    const enrichedStores = await Promise.all(
      (stores || []).map(async (store: any) => {
        // Get owner profile
        const { data: owner } = await supabase
          .from("profiles")
          .select("name, phone, city, country")
          .eq("address", store.owner_address)
          .single();

        // Get store stats
        const { data: products } = await supabase
          .from("products")
          .select("id", { count: "exact" })
          .eq("store_id", store.id);

        const { data: orders } = await supabase
          .from("orders")
          .select("amount", { count: "exact" })
          .eq("store_id", store.id);

        const totalRevenue = orders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

        return {
          id: store.id,
          name: store.name,
          description: store.description,
          ownerId: store.owner_address,
          ownerName: owner?.name || "Unknown",
          ownerEmail: owner?.phone || "N/A",
          ownerPhone: owner?.phone || "N/A",
          city: owner?.city || "Unknown",
          country: owner?.country || "Unknown",
          totalProducts: products?.length || 0,
          totalOrders: orders?.length || 0,
          totalRevenue,
          rating: 4.5,
          featured: false,
          createdAt: store.created_at || new Date().toISOString(),
          image_url: store.banner_url,
        };
      })
    );

    // Get total count
    let countQuery = supabase.from("stores").select("id", { count: "exact" });
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      stores: enrichedStores,
      total: totalCount || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}
