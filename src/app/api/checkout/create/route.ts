import { getSupabaseServerClient } from "@/lib/supabase";
import { checkoutCreateSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Removed manual legacy address check. We rely on Zod schema validation below.

    const parsed = checkoutCreateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "Invalid request data", details: parsed.error },
        { status: 400 }
      );
    }

    if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        { ok: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseServerClient();
    const items = parsed.data.items;

    // Step 1: Fetch product details
    const { data: prods, error: prodsError } = await supabase
      .from("products")
      .select("id, price, store_id, inventory")
      .in(
        "id",
        items.map((i) => i.productId)
      );

    if (prodsError || !prods || prods.length !== items.length) {
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

    const feeAmount = amount * (feePercent / 100);
    const vendorEarnings = amount - feeAmount;

    // Step 6: Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_address: parsed.data.buyer,
        store_id: storeId,
        amount,
        fee_percent: feePercent,
        fee_amount: feeAmount,
        vendor_earnings: vendorEarnings,
        status: "pending",
        currency: parsed.data.currency,
        delivery_method: parsed.data.deliveryMethod,
        delivery_info: parsed.data.deliveryDetails,
        payment_method: parsed.data.paymentMethod, // Ensure DB has this column too if we want to query it later, or just rely on 'status' logic
        buyer_email: parsed.data.buyerEmail,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      // Release reservations
      for (const reservation of reservations) {
        await supabase.rpc("release_reservation", {
          p_reservation_id: reservation.reservationId,
        });
      }

      return Response.json(
        { ok: false, error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Step 7: Create order items
    const itemsRows = items.map((i) => {
      const p = prods.find((pp) => pp.id === i.productId)!;
      return {
        order_id: order.id,
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
        p_order_id: order.id,
      });
    }

    return Response.json({
      ok: true,
      orderId: order.id,
      currency: parsed.data.currency,
      payTo: store.owner_address,
      total: amount,
      paymentMethod: parsed.data.paymentMethod,
    });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return Response.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
