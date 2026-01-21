import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const address = await getSessionWallet(req);
  if (!address) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      stores(owner_address),
      order_items(
        product_id,
        price,
        qty,
        products(name)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  // Verify ownership: Buyer or Seller
  // @ts-ignore
  const isSeller = order.stores?.owner_address === address;
  const isBuyer = order.buyer_address === address;

  if (!isBuyer && !isSeller) {
    return Response.json({ error: "Forbidden: You do not have access to this order" }, { status: 403 });
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
  delete transformedOrder.stores; // Remove seller info from response if not needed, or keep for buyer

  return Response.json({ order: transformedOrder });
}
