import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { items, reservedBy } = await req.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return Response.json(
                { ok: false, error: "Invalid items array" },
                { status: 400 }
            );
        }

        if (!reservedBy) {
            return Response.json(
                { ok: false, error: "reservedBy is required" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();
        const reservations: { productId: string; reservationId: string }[] = [];
        const errors: string[] = [];

        // Try to reserve each item
        for (const item of items) {
            const { productId, qty } = item;

            try {
                // Call the reserve_inventory function
                const { data, error } = await supabase.rpc("reserve_inventory", {
                    p_product_id: productId,
                    p_quantity: qty,
                    p_reserved_by: reservedBy,
                    p_minutes: 10, // 10 minute reservation
                });

                if (error) {
                    throw error;
                }

                reservations.push({
                    productId,
                    reservationId: data,
                });
            } catch (error: any) {
                // If reservation fails, release all previous reservations
                for (const reservation of reservations) {
                    await supabase.rpc("release_reservation", {
                        p_reservation_id: reservation.reservationId,
                    });
                }

                errors.push(`${productId}: ${error.message}`);
                break;
            }
        }

        if (errors.length > 0) {
            return Response.json(
                {
                    ok: false,
                    error: "Failed to reserve inventory",
                    details: errors,
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            ok: true,
            reservations,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });
    } catch (error) {
        console.error("Inventory reservation error:", error);
        return Response.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
