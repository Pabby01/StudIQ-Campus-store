import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
        return Response.json({ error: "Address required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();



    // 1. Fetch orders (no joins)
    const { data: orders, error } = await supabase
        .from("orders")
        .select(`
      id,
      created_at,
      status,
      amount,
      currency,
      store_id,
      stores(name)
    `)
        .eq("buyer_address", address)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to fetch user orders:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
        return Response.json({ orders: [] });
    }

    // 2. Fetch items for these orders
    const orderIds = orders.map(o => o.id);
    const { data: items } = await supabase
        .from("order_items")
        .select("*, products(name, image_url)")
        .in("order_id", orderIds);

    // 3. Merge
    const transformedOrders = orders.map(order => {
        const orderItems = items?.filter(i => i.order_id === order.id) || [];
        return {
            ...order,
            items: orderItems.map((item: any) => ({
                id: item.product_id,
                price: item.price,
                qty: item.qty,
                product: item.products || { name: "Product " + item.product_id }
            })),
            store: order.stores // stores join usually works as it's simple FK, but if safe, keep it. If fails, user will say "Unknown Store".
        };
    });

    // Clean up stores property format if needed (PostgREST returns Object or Array? Single object usually for M:1)
    // The previous code had `stores(name)`.

    return Response.json({ orders: transformedOrders });
}
