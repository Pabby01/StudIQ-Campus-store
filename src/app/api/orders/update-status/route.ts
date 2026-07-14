import { getSupabaseServerClient } from "@/lib/supabase";
import { triggerNotification } from "@/lib/notifications";

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
  const { data: o } = await supabase.from("orders").select("store_id, buyer_address, buyer_email, escrow_pin").eq("id", orderId).single();
  if (!o) return Response.json({ ok: false }, { status: 404 });
  const { data: s } = await supabase.from("stores").select("owner_address").eq("id", o.store_id).single();
  if (!s || s.owner_address !== address) return Response.json({ ok: false }, { status: 403 });

  // Escrow PIN Validation for completion
  if (status === 'completed' && o.escrow_pin) {
    if (body.pin !== o.escrow_pin) {
      return Response.json(
        { ok: false, error: "Invalid Escrow PIN. Please ask the buyer for the correct 4-digit PIN to release funds." },
        { status: 401 }
      );
    }
  }

  // Update order status
  await supabase.from("orders").update({ status }).eq("id", orderId);

  // Send notifications based on status change
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

    // Trigger In-App & Push Notifications
    if (status === 'shipped') {
      await triggerNotification({
        user_id: o.buyer_address,
        title: 'Order Shipped! 📦',
        message: `Your order #${orderId.slice(0, 8)} has been shipped.`,
        type: 'success',
        url: '/dashboard/purchases'
      });

      if (buyerEmail) {
        sendShippingConfirmation(orderId, buyerName, buyerEmail)
          .catch(err => console.error('[Order Status] Failed to send shipping email:', err));
      }
    } else if (status === 'completed') {
      await triggerNotification({
        user_id: o.buyer_address,
        title: 'Order Delivered! ✨',
        message: `Your order #${orderId.slice(0, 8)} has been marked as completed.`,
        type: 'success',
        url: '/dashboard/purchases'
      });

      if (buyerEmail) {
        sendOrderCompleted(orderId, buyerName, buyerEmail)
          .catch(err => console.error('[Order Status] Failed to send completion email:', err));
      }
    }
  } catch (notifyError) {
    // Don't fail the status update if notification fails
    console.error('[Order Status] Notification error:', notifyError);
  }

  return Response.json({ ok: true });
}
