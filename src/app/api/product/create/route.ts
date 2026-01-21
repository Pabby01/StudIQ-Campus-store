import { getSupabaseServerClient } from "@/lib/supabase";
import { createProductSchema } from "@/lib/validators";
import { POINTS } from "@/lib/constants";
import { getSessionWallet } from "@/lib/session";

export async function POST(req: Request) {
  const sessionAddress = await getSessionWallet(req);
  if (!sessionAddress) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const address = sessionAddress; // Use address from session

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Validation error:", parsed.error);
    return Response.json(
      { ok: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  // Verify ownership: Does this wallet own this store?
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("owner_address")
    .eq("id", parsed.data.storeId)
    .single();

  if (storeError || !store) {
    return Response.json({ ok: false, error: "Store not found" }, { status: 404 });
  }

  if (store.owner_address !== sessionAddress) {
    return Response.json({ ok: false, error: "Forbidden: You do not own this store" }, { status: 403 });
  }

  const { data, error } = await supabase.from("products").insert({
    store_id: parsed.data.storeId,
    name: parsed.data.name,
    description: parsed.data.description,
    category: parsed.data.category,
    price: parsed.data.price,
    inventory: parsed.data.inventory,
    currency: parsed.data.currency,
    image_url: parsed.data.imageUrl ?? null,
    images: parsed.data.images ?? (parsed.data.imageUrl ? [parsed.data.imageUrl] : []),
    is_pod_enabled: parsed.data.isPodEnabled,
    original_price: parsed.data.originalPrice,
  }).select("id").single();

  if (error) {
    console.error("Product creation error:", error);
    return Response.json(
      { ok: false, error: "Failed to create product" },
      { status: 500 }
    );
  }

  // Award 5 points for every product listing
  try {
    const syncKey = process.env.SYNC_API_KEY;
    await fetch(`${req.headers.get("origin")}/api/points/award`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${syncKey}`
      },
      body: JSON.stringify({
        address,
        points: POINTS.PRODUCT_LISTED,
        reason: "Product listed",
      }),
    });
  } catch (e) {
    console.error("Points award failed:", e);
  }

  return Response.json({ ok: true, product: data });
}
