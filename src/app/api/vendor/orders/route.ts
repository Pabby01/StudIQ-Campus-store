import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address") ?? "";

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  // Find seller's store
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_address", address)
    .maybeSingle();

  if (!store) {
    return NextResponse.json([]);
  }

  // Fetch orders with full details
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        product_id,
        price,
        qty,
        products(
          name,
          image_url
        )
      )
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch vendor orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  // Transform response to match expected format
  const transformedOrders = orders?.map(order => ({
    ...order,
    items: order.order_items?.map((item: any) => ({
      id: item.product_id,
      price: item.price,
      qty: item.qty,
      product: item.products
    })) || []
  })) || [];

  // Clean up
  transformedOrders.forEach(order => {
    delete (order as any).order_items;
  });

  return NextResponse.json(transformedOrders);
}
