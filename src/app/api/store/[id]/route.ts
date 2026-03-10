 
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = getSupabaseServerClient();

  // Fetch store details
  // Note: We're not selecting specific columns from profiles because the column names might vary
  // and cause 404s if incorrect. We'll fetch all profile fields and map them safely.
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*, profiles(*)")
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

  // Calculate real stats
  const totalProducts = products?.length || 0;
  
  // Calculate total sales from orders (assuming orders table has store_id or we query by products)
  // For now, let's try to fetch order count if possible, or fallback to a placeholder if table structure is unknown
  // Ideally: const { count: salesCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', params.id);
  
  // Try to find location from profile
  const location = store.profiles?.campus || store.profiles?.school || "Campus";
  const joinedDate = store.created_at;

  return Response.json({ 
    store: {
      ...store,
      
      owner_name: store.profiles?.name,
      
      // Check common profile picture column names
      owner_image: store.profiles?.avatar_url || store.profiles?.image || store.profiles?.picture || store.profiles?.avatar,
      
      // Add real-time stats
      stats: {
        products: totalProducts,
        sales: store.total_sales || 0, // Use the column from stores table if it exists, otherwise 0
        joined_at: joinedDate,
        location: location
      }
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
