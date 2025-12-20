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
  if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ ok: false });
  }
  const supabase = getSupabaseServerClient();
  const { data: o } = await supabase.from("orders").select("store_id, buyer_address, buyer_email").eq("id", orderId).single();
  if (!o) return Response.json({ ok: false }, { status: 404 });
  const { data: s } = await supabase.from("stores").select("owner_address").eq("id", o.store_id).single();
  if (!s || s.owner_address !== address) return Response.json({ ok: false }, { status: 403 });

  // Update order status
  await supabase.from("orders").update({ status }).eq("id", orderId);

  // Send email notifications based on status change
  try {
    const { sendShippingConfirmation, sendOrderCompleted } = await import('@/lib/email');

    // Get buyer's profile for name
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('address', o.buyer_address)
      .single();

    const buyerName = buyerProfile?.name || 'Customer';
    const buyerEmail = o.buyer_email;

    if (!buyerEmail) {
      console.warn('[Order Status] No buyer email found for order:', orderId);
    } else {
      // Send appropriate email based on status
      if (status === 'shipped') {
        sendShippingConfirmation(orderId, buyerName, buyerEmail)
          .catch(err => console.error('[Order Status] Failed to send shipping email:', err));
      } else if (status === 'completed') {
        sendOrderCompleted(orderId, buyerName, buyerEmail)
          .catch(err => console.error('[Order Status] Failed to send completion email:', err));
      }
    }
  } catch (emailError) {
    // Don't fail the status update if email fails
    console.error('[Order Status] Email notification error:', emailError);
  }

  return Response.json({ ok: true });
}
