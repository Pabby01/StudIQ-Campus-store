import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export async function POST(req: Request) {
  const address = await getSessionWallet(req);
  if (!address) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, txSig } = await req.json();

  if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ ok: false });
  }

  const supabase = getSupabaseServerClient();

  // Verify ownership: Is this the buyer of the order?
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("buyer_address")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return Response.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  if (order.buyer_address !== address) {
    return Response.json({ ok: false, error: "Forbidden: You do not own this order" }, { status: 403 });
  }

  await supabase.from("orders").update({ tx_sig: txSig, paid: true, status: "paid" }).eq("id", orderId);
  return Response.json({ ok: true });
}
