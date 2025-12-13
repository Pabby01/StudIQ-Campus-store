import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log("Fetching order:", id);

  const supabase = getSupabaseServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        product_id,
        price,
        qty,
        products(name)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Order fetch error:", error);
    return Response.json({ error: "Order not found", details: error }, { status: 404 });
  }

  if (!order) {
    console.error("Order not found in database:", id);
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  // Transform order_items to match expected format (items with id field)
  const transformedOrder = {
    ...order,
    items: order.order_items?.map((item: any) => ({
      id: item.product_id, // Use product_id as id for the UI
      price: item.price,
      qty: item.qty,
      product: item.products
    })) || []
  };

  delete transformedOrder.order_items; // Remove original field

  console.log("Order found:", transformedOrder.id);
  return Response.json({ order: transformedOrder });
}
