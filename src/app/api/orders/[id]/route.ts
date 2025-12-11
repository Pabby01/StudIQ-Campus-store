import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = getSupabaseServerClient();

    const { data: order, error } = await supabase
        .from("orders")
        .select(`
      *,
      items:order_items(
        id,
        price,
        qty,
        product:products(name)
      )
    `)
        .eq("id", id)
        .single();

    if (error || !order) {
        return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json({ order });
}
