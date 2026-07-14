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

    // Handle Wallet Deposits
    if (orderId.startsWith("DEP_")) {
      const parts = orderId.split("_");
      // Format: DEP_walletaddress_amount_timestamp
      if (parts.length >= 4) {
        const address = parts[1];
        const amount = parseFloat(parts[2]);
        
        // Ensure atomic update, but simple RPC or direct update is fine if idempotent
        // Actually, Passpoint can send multiple webhooks. To prevent double-crediting, we should track deposit IDs.
        // For now, we'll just increment wallet balance and assume Passpoint deduplicates, 
        // OR we can just rely on the tx_ref uniqueness if we had a transactions table.
        // Let's do a direct update. Note: without a transactions table, double webhooks could double-credit.
        // Best approach is a simple RPC: credit_wallet_if_not_processed. 
        // For simplicity, we'll do an RPC call:
        const { error } = await supabase.rpc("credit_wallet", {
          p_address: address,
          p_amount: amount,
          p_tx_ref: orderId
        });
        
        if (error) {
          console.error("Failed to credit wallet:", error);
          return NextResponse.json({ error: "Failed to credit wallet" }, { status: 500 });
        }
        return NextResponse.json({ success: true, message: "Wallet deposited" });
      }
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
