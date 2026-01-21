import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, stores(name, id)")
    .eq("id", id)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 404 });
  }

  return Response.json({ product: data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const address = await getSessionWallet(req);
  if (!address) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();

  // Verify ownership via store
  const { data: product } = await supabase
    .from("products")
    .select("store_id, stores(owner_address)")
    .eq("id", id)
    .single();

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  // @ts-ignore
  if (product.stores?.owner_address !== address) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const address = await getSessionWallet(req);
  if (!address) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const supabase = getSupabaseServerClient();

  // Verify ownership via store
  const { data: product } = await supabase
    .from("products")
    .select("store_id, stores(owner_address)")
    .eq("id", id)
    .single();

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  // @ts-ignore
  if (product.stores?.owner_address !== address) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("products")
    .update(body)
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
