import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();
  const address = body.address;
  const { productId } = body;

  if (!address) {
    return Response.json(
      { ok: false, error: "Wallet address required" },
      { status: 401 }
    );
  }

  if (!productId) {
    return Response.json(
      { ok: false, error: "Product ID required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("wishlists")
    .insert({ address, product_id: productId });

  if (error) {
    console.error("Wishlist add error:", error);
    return Response.json(
      { ok: false, error: "Failed to add to wishlist" },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
