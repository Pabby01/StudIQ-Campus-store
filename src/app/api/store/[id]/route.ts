import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return Response.json({ error: "Store not found" }, { status: 404 });
  }

  return Response.json({ store: data });
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const address = await getSessionWallet(req);
  if (!address) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await props.params;
  const supabase = getSupabaseServerClient();

  // Verify ownership
  const { data: store } = await supabase
    .from("stores")
    .select("owner_address")
    .eq("id", params.id)
    .single();

  if (!store) {
    return Response.json({ error: "Store not found" }, { status: 404 });
  }

  if (store.owner_address !== address) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("id", params.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const address = await getSessionWallet(req);
  if (!address) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await props.params;
  const body = await req.json();
  const supabase = getSupabaseServerClient();

  // Verify ownership
  const { data: store } = await supabase
    .from("stores")
    .select("owner_address")
    .eq("id", params.id)
    .single();

  if (!store) {
    return Response.json({ error: "Store not found" }, { status: 404 });
  }

  if (store.owner_address !== address) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("stores")
    .update(body)
    .eq("id", params.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
