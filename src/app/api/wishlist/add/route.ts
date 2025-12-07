import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWalletFromReq } from "@/lib/session";

export async function POST(req: Request) {
  const address = getSessionWalletFromReq(req);
  if (!address) return Response.json({ ok: false }, { status: 401 });
  const { productId } = await req.json();
  const supabase = getSupabaseServerClient();
  await supabase.from("wishlists").insert({ address, product_id: productId });
  return Response.json({ ok: true });
}
