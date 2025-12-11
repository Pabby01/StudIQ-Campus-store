import { getSupabaseServerClient } from "@/lib/supabase";
import { createProductSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json();
  const address = body.address;

  if (!address) {
    return Response.json(
      { ok: false, error: "Wallet address required" },
      { status: 401 }
    );
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Validation error:", parsed.error); // Log to server console
    return Response.json(
      { ok: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.from("products").insert({
    store_id: parsed.data.storeId,
    name: parsed.data.name,
    category: parsed.data.category,
    price: parsed.data.price,
    inventory: parsed.data.inventory,
    currency: parsed.data.currency,
    image_url: parsed.data.imageUrl ?? null,
    images: parsed.data.images ?? (parsed.data.imageUrl ? [parsed.data.imageUrl] : []),
  }).select("id").single();

  if (error) {
    console.error("Product creation error:", error);
    return Response.json(
      { ok: false, error: "Failed to create product" },
      { status: 500 }
    );
  }

  // Check if this is the first product and award points
  try {
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", parsed.data.storeId);

    if (count === 1) {
      // First product - award 25 points
      await fetch(`${req.headers.get("origin")}/api/points/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          points: 25,
          reason: "First product added",
        }),
      });
    }
  } catch (e) {
    console.error("Points award failed:", e);
  }

  return Response.json({ ok: true, product: data });
}
