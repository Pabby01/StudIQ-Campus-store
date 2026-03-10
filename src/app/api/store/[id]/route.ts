 
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = getSupabaseServerClient();

  // Fetch store details
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*, profiles(name, image)")
    .eq("id", params.id)
    .single();

  if (storeError || !store) {
    console.error("Store Fetch Error:", storeError);
    return Response.json({ error: "Store not found", details: storeError }, { status: 404 });
  }

  // Fetch store products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", params.id)
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Products Fetch Error:", productsError);
  }

  return Response.json({ 
    store: {
      ...store,
      owner_name: store.profiles?.name,
      
      owner_image: store.profiles?.image
    },
    products: products || [] 
  });
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
