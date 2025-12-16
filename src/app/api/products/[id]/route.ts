import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
        .from("products")
        .select(`
      *,
      stores (
        id,
        name,
        owner_address
      )
    `)
        .eq("id", params.id)
        .single();

    if (error || !data) {
        return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ product: data });
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = getSupabaseServerClient();

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", params.id);

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
}
