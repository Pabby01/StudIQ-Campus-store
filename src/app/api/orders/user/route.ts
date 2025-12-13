import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
        return Response.json({ error: "Address required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { data: orders, error } = await supabase
        .from("orders")
        .select(`
      id,
      created_at,
      status,
      amount,
      currency,
      order_items(
        product_id,
        price,
        qty,
        products(name, image_url)
      ),
      stores(name)
    `)
        .eq("buyer_address", address)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to fetch user orders:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }

    // Transform the response to match expected format
    const transformedOrders = orders?.map(order => ({
        ...order,
        items: order.order_items?.map((item: any) => ({
            id: item.product_id, // Use product_id as id
            price: item.price,
            qty: item.qty,
            product: item.products
        })) || [],
        store: order.stores
    })) || [];

    // Clean up
    transformedOrders.forEach(order => {
        delete (order as any).order_items;
        delete (order as any).stores;
    });

    return Response.json({ orders: transformedOrders });
}
