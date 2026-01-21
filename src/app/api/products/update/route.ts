import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { verifyProductOwnership } from "@/lib/ownership";
import { getSessionWallet } from "@/lib/session";

// PUT /api/products/update - Update product details
export async function PUT(req: Request) {
    try {
        const address = await getSessionWallet(req);
        if (!address) {
            return NextResponse.json(
                { error: "Unauthorized: Active wallet session required" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            productId,
            name,
            description,
            price,
            currency,
            category,
            image_url,
            inventory,
            original_price
        } = body;
        const userAddress = address;

        if (!productId || !userAddress) {
            return NextResponse.json(
                { error: "Product ID required" },
                { status: 400 }
            );
        }

        // Verify ownership
        const isOwner = await verifyProductOwnership(productId, userAddress);
        if (!isOwner) {
            return NextResponse.json(
                { error: "Unauthorized. You can only edit your own products." },
                { status: 403 }
            );
        }

        const supabase = getSupabaseServerClient();

        // Build updates object
        const updates: any = {
            updated_at: new Date().toISOString()
        };

        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (price !== undefined) updates.price = price;
        if (currency !== undefined) updates.currency = currency;
        if (category !== undefined) updates.category = category;
        if (image_url !== undefined) updates.image_url = image_url;
        if (inventory !== undefined) updates.inventory = inventory;
        if (original_price !== undefined) updates.original_price = original_price;

        const { data, error } = await supabase
            .from("products")
            .update(updates)
            .eq("id", productId)
            .select()
            .single();

        if (error) {
            console.error("Product update error:", error);
            return NextResponse.json(
                { error: "Failed to update product" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            product: data,
            message: "Product updated successfully"
        });
    } catch (error) {
        console.error("Product update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
