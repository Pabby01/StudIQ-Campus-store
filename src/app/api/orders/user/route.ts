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
      items:order_items(
        id,
        price,
        qty,
        product:products(name, image_url)
      ),
      store:stores(name)
    `)
        .eq("buyer_address", address)
        .order("created_at", { ascending: false });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ orders });
}
