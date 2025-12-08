import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();
  const address = body.address;
  const { productId, rating, comment } = body;

  if (!address) {
    return Response.json(
      { ok: false, error: "Wallet address required" },
      { status: 401 }
    );
  }

  if (!productId || !rating) {
    return Response.json(
      { ok: false, error: "Product ID and rating required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("reviews")
    .insert({
      product_id: productId,
      reviewer_address: address,
      rating,
      content: comment || null,
    });

  if (error) {
    console.error("Review add error:", error);
    return Response.json(
      { ok: false, error: "Failed to add review" },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
