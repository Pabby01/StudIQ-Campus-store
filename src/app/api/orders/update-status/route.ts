import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();
  const address = body.address;
  const { orderId, status } = body;

  if (!address) {
    return Response.json(
      { ok: false, error: "Wallet address required" },
      { status: 401 }
    );
  }

  if (!orderId || !status) {
    return Response.json(
      { ok: false, error: "Order ID and status required" },
      { status: 400 }
    );
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ ok: false });
  }
  const supabase = getSupabaseServerClient();
  const { data: o } = await supabase.from("orders").select("store_id").eq("id", orderId).single();
  if (!o) return Response.json({ ok: false }, { status: 404 });
  const { data: s } = await supabase.from("stores").select("owner_address").eq("id", o.store_id).single();
  if (!s || s.owner_address !== address) return Response.json({ ok: false }, { status: 403 });
  await supabase.from("orders").update({ status }).eq("id", orderId);
  return Response.json({ ok: true });
}
