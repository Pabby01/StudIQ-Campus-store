import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[Passpoint Webhook] Received payload:", payload);

    // E.g. event: 'collection.successful' or 'payment.successful'
    // Reference is our orderId
    const orderId = payload?.data?.reference || payload?.reference;
    
    if (!orderId) {
      return NextResponse.json({ error: "Missing reference/orderId" }, { status: 400 });
    }

    // Verify order exists
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid" || order.status === "completed") {
      return NextResponse.json({ success: true, message: "Order already paid" });
    }

    // Mark as paid
    await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);

    // Trigger email notifications
    try {
      const { sendOrderConfirmation, sendSellerNotification } = await import('@/lib/email');
      
      const { data: store } = await supabase
        .from("stores")
        .select("name, owner_address")
        .eq("id", order.store_id)
        .single();
        
      if (order.buyer_email) {
        await sendOrderConfirmation({
          orderId: order.id,
          buyerName: order.delivery_info?.name || "Customer",
          buyerEmail: order.buyer_email,
          products: [], // Webhook doesn't easily have products array, so we leave it empty for now
          total: order.amount,
          currency: order.currency,
          deliveryMethod: order.delivery_method,
          deliveryAddress: order.delivery_info
        });
      }
      
      if (store?.owner_address) {
        // Here we'd get seller email using admin client in a real scenario
        // Fallback to platform admin for now
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          await sendSellerNotification({
            orderId: order.id,
            sellerEmail: adminEmail,
            storeName: store.name || "Campus Store",
            buyerName: order.delivery_info?.name || "Customer",
            deliveryAddress: order.delivery_info,
            products: [],
            total: order.vendor_earnings,
            currency: order.currency
          });
        }
      }
    } catch (e) {
      console.error("[Passpoint Webhook] Email error:", e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Passpoint Webhook] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
