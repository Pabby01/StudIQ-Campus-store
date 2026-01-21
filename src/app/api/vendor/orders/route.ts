import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request) {
  const address = await getSessionWallet(req);

  if (!address) {
    return NextResponse.json({ error: "Unauthorized: Active session required" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  // Find seller's stores (handle multiple)
  const { data: stores } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_address", address);

  if (!stores || stores.length === 0) {
    return NextResponse.json([]);
  }

  const storeIds = stores.map(s => s.id);

  // Fetch orders (no join)
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .in("store_id", storeIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch vendor orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json([]);
  }

  const orderIds = orders.map(o => o.id);

  // Fetch items for these orders
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*, products(name, image_url)")
    .in("order_id", orderIds);

  if (itemsError) {
    console.error("Failed to fetch order items:", itemsError);
  }

  // Merge items into orders
  const transformedOrders = orders.map(order => {
    const orderItems = items?.filter(i => i.order_id === order.id) || [];
    return {
      ...order,
      items: orderItems.map((item: any) => ({
        id: item.product_id,
        price: item.price,
        qty: item.qty,
        product: item.products || { name: "Product " + item.product_id }
      }))
    };
  });

  return NextResponse.json(transformedOrders);
}
