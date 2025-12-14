import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const supabase = getSupabaseServerClient();

    // Normalize ID to lowercase for searching
    const normalizedId = id.toLowerCase();

    // Try to find order by full ID first (if it's a valid UUID format)
    if (normalizedId.length > 8 && normalizedId.includes("-")) {
        const { data: order, error } = await supabase
            .from("orders")
            .select(`
        id,
        created_at,
        status,
        amount,
        currency,
        payment_method,
        delivery_method,
        delivery_info,
        order_items(
          product_id,
          price,
          qty,
          products(name, image_url)
        ),
        stores(name)
      `)
            .eq("id", normalizedId)
            .single();

        if (!error && order) {
            return NextResponse.json({ order: transformAndMaskOrder(order) });
        }
    }

    // Search by prefix using text casting (for short IDs like "eace0812")
    const { data: orders, error: searchError } = await supabase
        .from("orders")
        .select(`
      id,
      created_at,
      status,
      amount,
      currency,
      payment_method,
      delivery_method,
      delivery_info,
      order_items(
        product_id,
        price,
        qty,
        products(name, image_url)
      ),
      stores(name)
    `)
        .order("created_at", { ascending: false })
        .limit(100); // Get recent orders to search through

    if (searchError || !orders || orders.length === 0) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Filter in JavaScript since we can't use ilike on UUID
    const matchedOrder = orders.find(order =>
        order.id.toLowerCase().startsWith(normalizedId)
    );

    if (!matchedOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: transformAndMaskOrder(matchedOrder) });
}

function transformAndMaskOrder(order: any) {
    // Transform order items
    const transformedOrder = {
        ...order,
        items: order.order_items?.map((item: any) => ({
            id: item.product_id,
            price: item.price,
            qty: item.qty,
            product: item.products
        })) || [],
        store: order.stores
    };

    delete transformedOrder.order_items;
    delete transformedOrder.stores;

    // Mask sensitive buyer information for privacy
    return {
        ...transformedOrder,
        delivery_info: transformedOrder.delivery_info ? {
            name: transformedOrder.delivery_info.name?.replace(/(?<=.{2})./g, '*'),
            address: transformedOrder.delivery_info.address?.replace(/\d+/g, '***'),
            city: transformedOrder.delivery_info.city,
            zip: transformedOrder.delivery_info.zip?.replace(/\d/g, '*')
        } : null
    };
}
