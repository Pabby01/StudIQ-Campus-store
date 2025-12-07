import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWalletFromReq } from "@/lib/session";

export async function POST(req: Request) {
  const address = getSessionWalletFromReq(req);
  if (!address) return Response.json({ ok: false }, { status: 401 });
  const { orderId, status } = await req.json();
  const supabase = getSupabaseServerClient();
  const { data: o } = await supabase.from("orders").select("store_id").eq("id", orderId).single();
  if (!o) return Response.json({ ok: false }, { status: 404 });
  const { data: s } = await supabase.from("stores").select("owner_address").eq("id", o.store_id).single();
  if (!s || s.owner_address !== address) return Response.json({ ok: false }, { status: 403 });
  await supabase.from("orders").update({ status }).eq("id", orderId);
  return Response.json({ ok: true });
}
