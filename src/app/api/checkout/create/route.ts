import { getSupabaseServerClient } from "@/lib/supabase";
import { checkoutCreateSchema } from "@/lib/validators";
import { triggerNotification } from "@/lib/notifications";
import { getSessionWallet } from "@/lib/session";
import { SOLANA_CONFIG } from "@/lib/solana-config";
import { getTokenValue, Currency } from "paj_ramp";
import { PAJ_CONFIG } from "@/lib/paj";
import { createZendClient } from "pay-with-zend-sdk";

const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const MAINNET_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const mapMintForPaj = (mint: string) => {
  if (mint === DEVNET_USDC_MINT) return MAINNET_USDC_MINT;
  return mint;
};

export async function POST(req: Request) {
  try {
    const sessionAddress = await getSessionWallet(req);
    if (!sessionAddress) {
      return Response.json({ ok: false, error: "Unauthorized: Active wallet session required" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkoutCreateSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[Checkout Create] Validation failed:", parsed.error);
      return Response.json(
        { ok: false, error: "Invalid request data", details: parsed.error },
        { status: 400 }
      );
    }

    // Override buyer with verified session address
    const buyerAddress = sessionAddress;

    if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        { ok: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Ensure buyer profile exists before creating order (foreign key constraint)
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("address")
      .eq("address", buyerAddress)
      .maybeSingle();

    if (!buyerProfile) {
      console.log("[Checkout Create] Buyer profile not found, creating default profile for:", parsed.data.buyer);
      // Create a minimal profile to satisfy foreign key constraint
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          address: buyerAddress,
          name: parsed.data.deliveryDetails?.name || "User",
          email: parsed.data.buyerEmail || null,
          school: null,
          campus: null,
          level: null,
          phone: null,
        });

      if (profileError) {
        console.error("[Checkout Create] Failed to create buyer profile:", profileError);
        return Response.json(
          { ok: false, error: "Failed to create user profile. Please try again." },
          { status: 500 }
        );
      }
    }

    const items = parsed.data.items;

    // Step 1: Fetch product details
    const { data: prods, error: prodsError } = await supabase
      .from("products")
      .select("id, name, image_url, price, price_ngn, currency, store_id, inventory")
      .in(
        "id",
        items.map((i) => i.productId)
      );

    if (prodsError || !prods || prods.length !== items.length) {
      console.error("[Checkout Create] Product fetch error:", prodsError);
      return Response.json(
        { ok: false, error: "One or more products not found" },
        { status: 400 }
      );
    }
    // Step 2: Check inventory availability
    for (const item of items) {
      const product = prods.find((p) => p.id === item.productId);
      if (!product) {
        return Response.json(
          { ok: false, error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }

      // Get available inventory (accounting for reservations)
      const { data: available, error: invError } = await supabase.rpc(
        "get_available_inventory",
        { p_product_id: item.productId }
      );

      if (invError || (available !== null && available < item.qty)) {
        return Response.json(
          {
            ok: false,
            error: `Insufficient inventory for ${product.id}. Available: ${available}, Requested: ${item.qty}`,
          },
          { status: 400 }
        );
      }
    }

    // Step 3: Reserve inventory
    const reservations: { productId: string; reservationId: string }[] = [];

    try {
      for (const item of items) {
        const { data: reservationId, error: reserveError } = await supabase.rpc(
          "reserve_inventory",
          {
            p_product_id: item.productId,
            p_quantity: item.qty,
            p_reserved_by: buyerAddress,
            p_minutes: 10,
          }
        );

        if (reserveError) {
          throw new Error(`Failed to reserve ${item.productId}: ${reserveError.message}`);
        }

        reservations.push({
          productId: item.productId,
          reservationId,
        });
      }
    } catch (error) {
      console.error("[Checkout Create] Reservation error:", error);
      // Rollback all reservations on failure
      for (const reservation of reservations) {
        await supabase.rpc("release_reservation", {
          p_reservation_id: reservation.reservationId,
        });
      }

      return Response.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Failed to reserve inventory",
        },
        { status: 400 }
      );
    }

    // Step 4: Get store and seller info
    const storeId = prods[0].store_id;
    const { data: store } = await supabase
      .from("stores")
      .select("name, owner_address, delivery_fee, delivery_enabled, pickup_enabled")
      .eq("id", storeId)
      .single();

    if (!store) {
      // Release reservations
      for (const reservation of reservations) {
        await supabase.rpc("release_reservation", {
          p_reservation_id: reservation.reservationId,
        });
      }

      return Response.json(
        { ok: false, error: "Store not found" },
        { status: 400 }
      );
    }
    if (parsed.data.deliveryMethod === "shipping" && store.delivery_enabled === false) {
      return Response.json(
        { ok: false, error: "Store does not offer shipping" },
        { status: 400 }
      );
    }
    if (parsed.data.deliveryMethod === "pickup" && store.pickup_enabled === false) {
      return Response.json(
        { ok: false, error: "Store does not offer pickup" },
        { status: 400 }
      );
    }

    const feePercent = 5;

    const needsNgnRate = prods.some((p) => p.price_ngn);
    const ngnPerUsd = needsNgnRate ? await getNgnPerUsd() : null;

    // Step 5: Calculate totals
    const subtotal = items.reduce((sum, i) => {
      const p = prods.find((pp) => pp.id === i.productId)!;
      const unitPrice = getLiveUnitPrice(p, ngnPerUsd);
      return sum + unitPrice * i.qty;
    }, 0);
    const deliveryFee = parsed.data.deliveryMethod === "shipping" ? Number(store.delivery_fee ?? 0) : 0;
    const amount = subtotal + deliveryFee;

    const feeAmount = subtotal * (feePercent / 100);
    const vendorEarnings = subtotal - feeAmount + deliveryFee;

    // Step 6: Create order
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_address: buyerAddress,
        store_id: storeId,
        amount: amount, 
        fee_percent: feePercent,
        fee_amount: feeAmount,
        vendor_earnings: vendorEarnings,
        status: "pending",
        currency: parsed.data.currency,
        delivery_method: parsed.data.deliveryMethod,
        delivery_info: parsed.data.deliveryDetails,
        payment_method: parsed.data.paymentMethod,
        buyer_email: parsed.data.buyerEmail,
      })
      .select("id")
      .single();

    if (orderError || !newOrder) {
      console.error("[Checkout Create] Order creation error:", orderError);
      // Release reservations
      for (const reservation of reservations) {
        await supabase.rpc("release_reservation", {
          p_reservation_id: reservation.reservationId,
        });
      }

      return Response.json(
        { ok: false, error: "Failed to create order", details: orderError?.message },
        { status: 500 }
      );
    }
    
    // Step 7: Create order items
    const itemsRows = items.map((i) => {
      const p = prods.find((pp) => pp.id === i.productId)!;
      const unitPrice = getLiveUnitPrice(p, ngnPerUsd);
      return {
        order_id: newOrder.id, // Use newOrder.id
        product_id: i.productId,
        qty: i.qty,
        price: unitPrice,
      };
    });

    await supabase.from("order_items").insert(itemsRows);

    // Step 8: Confirm reservations (link to order and decrement inventory)
    for (const reservation of reservations) {
      await supabase.rpc("confirm_reservation", {
        p_reservation_id: reservation.reservationId,
        p_order_id: newOrder.id,
      });
    }

    // Step 8: Send email notifications (Only for non-crypto orders immediately)
    // For crypto, we send after verification in /api/checkout/verify-transaction
    if (parsed.data.paymentMethod !== 'solana' && parsed.data.paymentMethod !== 'zend') {
      try {
        // Import email functions
        const { sendOrderConfirmation, sendSellerNotification } = await import('@/lib/email');

        // Get store information for seller email
        const { data: store } = await supabase
          .from('stores')
          .select('name, owner_address')
          .eq('id', storeId) // Changed from parsed.data.storeId to storeId
          .single();

        // Get store owner's email
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('address', store?.owner_address)
          .single();

        // Prepare order details for emails
        const orderDetails = {
          orderId: newOrder.id,
          buyerName: parsed.data.deliveryDetails?.name || 'Customer',
          buyerEmail: parsed.data.buyerEmail,
          products: items.map(i => {
            const product = prods.find(p => p.id === i.productId)!;
            const unitPrice = getLiveUnitPrice(product, ngnPerUsd);
            return {
              name: product.name,
              imageUrl: product.image_url,
              price: unitPrice,
              qty: i.qty,
            };
          }),
          total: amount,
          currency: parsed.data.currency,
          deliveryMethod: parsed.data.deliveryMethod,
          deliveryAddress: parsed.data.deliveryMethod === 'shipping' ? {
            address: parsed.data.deliveryDetails?.address || '',
            city: parsed.data.deliveryDetails?.city || '',
            zip: parsed.data.deliveryDetails?.zip || '',
          } : undefined,
        };

        // Send buyer confirmation (non-blocking)
        sendOrderConfirmation(orderDetails).catch(err =>
          console.error('[Checkout] Failed to send buyer confirmation:', err)
        );

        // Send seller notification if we have their email (non-blocking)
        if (ownerProfile?.email && store) {
          sendSellerNotification({
            orderId: newOrder.id,
            sellerEmail: ownerProfile.email,
            storeName: store.name,
            buyerName: parsed.data.deliveryDetails?.name || 'Customer',
            deliveryAddress: parsed.data.deliveryMethod === 'shipping' ? {
              name: parsed.data.deliveryDetails?.name || '',
              address: parsed.data.deliveryDetails?.address || '',
              city: parsed.data.deliveryDetails?.city || '',
              zip: parsed.data.deliveryDetails?.zip || '',
            } : undefined,
            products: orderDetails.products,
            total: amount,
            currency: parsed.data.currency,
          }).catch(err =>
            console.error('[Checkout] Failed to send seller notification:', err)
          );
        }
      } catch (emailError) {
        console.error('[Checkout] Email notification error:', emailError);
      }
    }

    if (parsed.data.paymentMethod !== 'solana' && parsed.data.paymentMethod !== 'zend') {
      try {
        if (buyerAddress) {
          await triggerNotification({
            user_id: buyerAddress,
            title: 'Order Placed! 🛍️',
            message: `Your order #${newOrder.id.slice(0, 8)} has been placed successfully.`,
            type: 'success',
            url: '/dashboard/purchases'
          });
        }

        if (store?.owner_address) {
          await triggerNotification({
            user_id: store.owner_address,
            title: 'New Order Received! 💰',
            message: `You have a new order #${newOrder.id.slice(0, 8)} for ${parsed.data.currency} ${amount}.`,
            type: 'success',
            url: '/dashboard/sales'
          });
        }
      } catch (notifyError) {
        console.error('[Checkout] In-App Notification error:', notifyError);
      }
    }

    // Step 9: Create Zend Payment Link
    let payUrl = null;
    if (parsed.data.paymentMethod === 'solana' || parsed.data.paymentMethod === 'zend') {
      try {
        let apiKey = process.env.ZEND_API_KEY || "";
        if (!apiKey) {
          try {
            const fs = require('fs');
            const path = require('path');
            const os = require('os');
            const configPath = path.join(os.homedir(), '.zend', 'config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            apiKey = config.apiKey || "";
          } catch (e) {
            console.error("Could not read ~/.zend/config.json fallback");
          }
        }

        const zendClient = createZendClient({
          apiKey: apiKey,
        });
        
        // Determine host for redirect URL
        const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
        const proto = req.headers.get("x-forwarded-proto") ?? "https";
        const origin = req.headers.get("origin") ?? (host ? `${proto}://${host}` : null);
        
        const redirectUrl = origin ? `${origin}/cart?orderId=${newOrder.id}` : undefined;

        const payment = await zendClient.createZendPayment({
          amount: amount,
          description: `Order #${newOrder.id.slice(0, 8)} at ${store.name || 'Campus Store'}`,
          redirectUrl: redirectUrl,
        });
        
        // Store the Zend payment ID in the tx_sig field temporarily so we can verify it later
        await supabase.from("orders").update({ tx_sig: payment.id }).eq("id", newOrder.id);
        
        payUrl = payment.linkUrl;
      } catch (zendErr) {
        console.error("[Checkout Create] Zend Payment Error:", zendErr);
        // We could fail the order here, or return an error
        return Response.json(
          { ok: false, error: "Failed to initialize payment gateway." },
          { status: 500 }
        );
      }
    }

    return Response.json({
      ok: true,
      orderId: newOrder.id,
      payUrl: payUrl,
      amount: amount,
      currency: parsed.data.currency,
    });
  } catch (error) {
    console.error("Checkout create error:", error);
    return Response.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function extractTokenValue(tokenValue: unknown): number | null {
  if (typeof tokenValue === "number") return tokenValue;
  if (!tokenValue || typeof tokenValue !== "object") return null;
  const value = tokenValue as Record<string, unknown>;
  const direct =
    (typeof value.amount === "number" && value.amount) ||
    (typeof value.value === "number" && value.value) ||
    (typeof value.ngn === "number" && value.ngn) ||
    (typeof value.rate === "number" && value.rate);
  return typeof direct === "number" ? direct : null;
}

async function getNgnPerUsd() {
  try {
    const usdcMint = process.env.NEXT_PUBLIC_USDC_MINT || DEVNET_USDC_MINT;
    const mappedMint = mapMintForPaj(usdcMint);
    const tokenValue = await getTokenValue({
      amount: 1,
      mint: mappedMint,
      currency: Currency.NGN
    }, PAJ_CONFIG.apiKey);
    return extractTokenValue(tokenValue);
  } catch {
    return null;
  }
}

async function getSolUsd(req: Request) {
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const origin = req.headers.get("origin") ?? (host ? `${proto}://${host}` : null);
    if (!origin) return null;
    const res = await fetch(`${origin}/api/price/sol`);
    if (!res.ok) return null;
    const data = await res.json();
    const value = Number(data?.price);
    return value && !Number.isNaN(value) ? value : null;
  } catch {
    return null;
  }
}

function getLiveUnitPrice(
  product: { price: number; price_ngn?: number | null; currency?: "USDC" | "USDT" | "USD" },
  ngnPerUsd: number | null
) {
  // Stablecoins only: all products priced in NGN, convert back to payment currency
  if (product.price_ngn && ngnPerUsd) {
    return product.price_ngn / ngnPerUsd;
  }
  return Number(product.price);
}
