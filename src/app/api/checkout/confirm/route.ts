import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const { orderId, txSig } = await req.json();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ ok: false });
  }
  const supabase = getSupabaseServerClient();
  await supabase.from("orders").update({ tx_sig: txSig, paid: true, status: "paid" }).eq("id", orderId);
  return Response.json({ ok: true });
}
