import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
        return Response.json({ error: "Product ID required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ reviews: data });
}

export async function POST(req: Request) {
    const body = await req.json();
    const { productId, address, rating, content } = body;

    if (!productId || !address || !rating) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Verify purchase? (Optional, skipping for now per request)

    const { error } = await supabase
        .from("reviews")
        .insert({
            product_id: productId,
            reviewer_address: address,
            rating,
            content,
        });

    if (error) {
        console.error("Review post error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }

    // Award 10 points to reviewer
    try {
        await fetch(`${req.headers.get("origin")}/api/points/award`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                address,
                points: 10,
                reason: "Product review",
            }),
        });

        // If 5-star review, award seller 25 points
        if (rating === 5) {
            const { data: product } = await supabase
                .from("products")
                .select("store_id, stores(owner_address)")
                .eq("id", productId)
                .single();

            if (product) {
                await fetch(`${req.headers.get("origin")}/api/points/award`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        address: (product.stores as any).owner_address,
                        points: 25,
                        reason: "Received 5-star review",
                    }),
                });
            }
        }
    } catch (e) {
        console.error("Points award failed:", e);
    }

    return Response.json({ success: true });
}
