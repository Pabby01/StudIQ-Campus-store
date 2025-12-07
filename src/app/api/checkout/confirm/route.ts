import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const { orderId, txSig } = await req.json();
  const supabase = getSupabaseServerClient();
  await supabase.from("orders").update({ tx_sig: txSig, paid: true, status: "paid" }).eq("id", orderId);
  return Response.json({ ok: true });
}

