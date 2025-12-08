import { getSupabaseServerClient } from "@/lib/supabase";
import { updateProductSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json();
  const address = body.address;

  if (!address) {
    return Response.json(
      { ok: false, error: "Wallet address required" },
      { status: 401 }
    );
  }

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid input" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from("products").update({
    name: parsed.data.name,
    category: parsed.data.category,
    price: parsed.data.price,
    inventory: parsed.data.inventory,
    image_url: parsed.data.imageUrl ?? null,
  }).eq("id", parsed.data.id);
  return Response.json({ ok: true });
}
