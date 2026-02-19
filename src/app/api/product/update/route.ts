import { getSupabaseServerClient } from "@/lib/supabase";
import { updateProductSchema } from "@/lib/validators";
import { getSessionWallet } from "@/lib/session";
import { verifyProductOwnership } from "@/lib/ownership";

export async function POST(req: Request) {
  const address = await getSessionWallet(req);
  if (!address) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid input" },
      { status: 400 }
    );
  }

  const isOwner = await verifyProductOwnership(parsed.data.id, address);
  if (!isOwner) {
    return Response.json(
      { ok: false, error: "Forbidden: You can only edit your own products" },
      { status: 403 }
    );
  }

  const supabase = getSupabaseServerClient();

  const updates = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    category: parsed.data.category,
    price: parsed.data.price,
    price_ngn: parsed.data.priceNgn ?? null,
    inventory: parsed.data.inventory,
    currency: parsed.data.currency,
    image_url: parsed.data.imageUrl ?? null,
    images: parsed.data.images ?? (parsed.data.imageUrl ? [parsed.data.imageUrl] : []),
    is_pod_enabled: parsed.data.isPodEnabled ?? false,
    original_price: parsed.data.originalPrice ?? null,
  };

  const { error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", parsed.data.id);

  if (error) {
    console.error("Product update error:", error);
    return Response.json(
      { ok: false, error: "Failed to update product" },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
