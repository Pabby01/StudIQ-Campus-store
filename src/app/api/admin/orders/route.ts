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
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    let query = supabase
      .from("orders")
      .select("*, stores(name), profiles(name, email)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Search filter
    if (search) {
      query = query.or(`id.ilike.%${search}%,user_address.ilike.%${search}%,store_id.ilike.%${search}%`);
    }

    const { data: orders, error, count } = await query;

    if (error) throw error;

    // Format response
    const formattedOrders = (orders || []).map((order: any) => ({
      id: order.id,
      userId: order.user_address,
      userName: order.profiles?.name || "Unknown",
      userEmail: order.profiles?.email || "N/A",
      storeId: order.store_id,
      storeName: order.stores?.name || "Unknown",
      amount: order.total_amount,
      status: order.status,
      items: order.items_count || 0,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      payment_method: order.payment_method || "USDC",
      tx_signature: order.tx_signature || "N/A",
    }));

    // Calculate totals
    const { data: allOrders } = await supabase
      .from("orders")
      .select("total_amount, status");

    const totalRevenue = (allOrders || []).reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    );
    const completedOrders = (allOrders || []).filter(
      (o) => o.status === "completed"
    ).length;
    const pendingOrders = (allOrders || []).filter(
      (o) => o.status === "pending"
    ).length;

    // Get total count
    let countQuery = supabase.from("orders").select("id", { count: "exact" });
    if (status && status !== "all") {
      countQuery = countQuery.eq("status", status);
    }
    if (search) {
      countQuery = countQuery.or(
        `id.ilike.%${search}%,user_address.ilike.%${search}%,store_id.ilike.%${search}%`
      );
    }
    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      orders: formattedOrders,
      total: totalCount || 0,
      totalRevenue: Math.round(totalRevenue),
      completedOrders,
      pendingOrders,
      failedOrders: (allOrders || []).filter(
        (o) => o.status === "failed"
      ).length,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
