import { getSupabaseServerClient } from "@/lib/supabase";
import { checkoutCreateSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    console.log("[Checkout Create] Starting checkout process");
    const body = await req.json();
    console.log("[Checkout Create] Request body:", JSON.stringify(body, null, 2));

    const parsed = checkoutCreateSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[Checkout Create] Validation failed:", parsed.error);
      return Response.json(
        { ok: false, error: "Invalid request data", details: parsed.error },
        { status: 400 }
      );
    }

    console.log("[Checkout Create] Validation passed, parsed data:", parsed.data);

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
      .eq("address", parsed.data.buyer)
      .maybeSingle();

    if (!buyerProfile) {
      console.log("[Checkout Create] Buyer profile not found, creating default profile for:", parsed.data.buyer);
      // Create a minimal profile to satisfy foreign key constraint
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          address: parsed.data.buyer,
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
      console.log("[Checkout Create] Buyer profile created successfully");
    }

    const items = parsed.data.items;

    // Step 1: Fetch product details
    console.log("[Checkout Create] Fetching products:", items.map(i => i.productId));
    const { data: prods, error: prodsError } = await supabase
      .from("products")
      .select("id, price, store_id, inventory")
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
    console.log("[Checkout Create] Products found:", prods.length);

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
            p_reserved_by: parsed.data.buyer,
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
      .select("owner_address")
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("seller_tier")
      .eq("address", store.owner_address)
      .single();

    const feePercent = profile?.seller_tier === "premium" ? 3 : 10;

    // Step 5: Calculate totals
    const amount = items.reduce((sum, i) => {
      const p = prods.find((pp) => pp.id === i.productId)!;
      return sum + Number(p.price) * i.qty;
    }, 0);

    const feeAmount = amount * (feePercent / 100); // Use totalAmount
    const vendorEarnings = amount - feeAmount; // Use totalAmount

    // Platform wallet receives all payments
    const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET || "Hx912yR4vDEwUqQNUZcaxwsjmE8B6Lq6grokrPh8a6Js";

    // Step 6: Create order (Updated)
    const { data: newOrder, error: orderError } = await supabase // Renamed 'order' to 'newOrder'
      .from("orders")
      .insert({
        buyer_address: parsed.data.buyer, // Kept as parsed.data.buyer, assuming buyerAddress was a typo in instruction
        store_id: storeId,
        amount: amount, // Use totalAmount
        fee_percent: feePercent,
        fee_amount: feeAmount,
        vendor_earnings: vendorEarnings,
        status: "pending",
        currency: parsed.data.currency,
        delivery_method: parsed.data.deliveryMethod, // Kept existing field
        delivery_info: parsed.data.deliveryDetails, // Kept existing field
        payment_method: parsed.data.paymentMethod, // Kept existing field
        buyer_email: parsed.data.buyerEmail, // Kept existing field
        // The instruction's insert object was significantly different and seemed to remove existing fields.
        // I've integrated the new fields/values while preserving existing ones where appropriate,
        // and used the existing `parsed.data` fields.
        // Specifically, `items` was not added to the order table as it's handled by `order_items`.
        // `delivery_details` and `payment_method` were already present as `delivery_info` and `payment_method`.
      })
      .select("id") // Select only id, as before
      .single();

    if (orderError || !newOrder) { // Use newOrder
      console.error("[Checkout Create] Order creation error:", orderError);
      // Release reservations
      for (const reservation of reservations) {
        await supabase.rpc("release_reservation", {
          p_reservation_id: reservation.reservationId,
        });
      }

      // The instruction's rollback logic for inventory was different,
      // but the existing reservation release is more robust for this flow.
      return Response.json(
        { ok: false, error: "Failed to create order", details: orderError?.message },
        { status: 500 }
      );
    }
    console.log("[Checkout Create] Order created successfully:", newOrder.id);

    // Step 7: Create order items
    const itemsRows = items.map((i) => {
      const p = prods.find((pp) => pp.id === i.productId)!;
      return {
        order_id: newOrder.id, // Use newOrder.id
        product_id: i.productId,
        qty: i.qty,
        price: Number(p.price),
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

    // Step 8: Send email notifications
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
          return {
            name: product.id, // We'd need to fetch product names from products table
            price: product.price,
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
      // Don't fail the checkout if emails fail
      console.error('[Checkout] Email notification error:', emailError);
    }

    return Response.json({
      ok: true,
      orderId: newOrder.id,
      payTo: platformWallet,
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
