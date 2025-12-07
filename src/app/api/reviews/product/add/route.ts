import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWalletFromReq } from "@/lib/session";

export async function POST(req: Request) {
  const address = getSessionWalletFromReq(req);
  if (!address) return Response.json({ ok: false }, { status: 401 });
  const { productId, rating, content } = await req.json();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ ok: false });
  }
  const supabase = getSupabaseServerClient();
  await supabase.from("reviews").insert({ product_id: productId, reviewer_address: address, rating, content });
  return Response.json({ ok: true });
}
