/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getSupabaseServerClient } from "@/lib/supabase";
import { POINTS } from "@/lib/constants";
import { getSessionWallet } from "@/lib/session";

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

    const reviewerAddresses = (data || [])
        .map((review) => review.reviewer_address)
        .filter(Boolean);

    const { data: reviewerProfiles } = reviewerAddresses.length
        ? await supabase
            .from("profiles")
            .select("address, name")
            .in("address", reviewerAddresses)
        : { data: [] };

    const reviewerNameMap = new Map(
        (reviewerProfiles || [])
            .filter((profile) => profile.address)
            .map((profile) => [profile.address, profile.name || null])
    );

    const reviews = (data || []).map((review) => ({
        ...review,
        reviewer_name: reviewerNameMap.get(review.reviewer_address) || null,
    }));

    return Response.json({ reviews });
}

export async function POST(req: Request) {
    const address = await getSessionWallet(req);
    if (!address) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, rating, content } = body;

    if (!productId || !rating) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Verify purchase check can be added here if needed

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

    // Award bonus points to reviewer
    try {
        const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await fetch(`${origin}/api/points/award`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.SYNC_API_KEY}`
            },
            body: JSON.stringify({
                address,
                points: POINTS.REVIEW,
                reason: "Product review",
            }),
        });

        // Recalculate and update product rating/stats
        const { data: stats } = await supabase
            .from("reviews")
            .select("rating")
            .eq("product_id", productId);

        if (stats) {
            const totalRating = stats.reduce((acc, curr) => acc + curr.rating, 0);
            const count = stats.length;
            const averageRating = count > 0 ? totalRating / count : 0;

            await supabase
                .from("products")
                .update({
                    rating: averageRating,
                    reviews_count: count
                })
                .eq("id", productId);
        }

        // If 5-star review, award seller bonus points
        if (rating === 5) {
            const { data: product } = await supabase
                .from("products")
                .select("store_id, stores(owner_address)")
                .eq("id", productId)
                .single();

            if (product) {
                // @ts-expect-error
                const ownerAddress = product.stores?.owner_address;
                if (ownerAddress) {
                    await fetch(`${origin}/api/points/award`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${process.env.SYNC_API_KEY}`
                        },
                        body: JSON.stringify({
                            address: ownerAddress,
                            points: POINTS.REVIEW_5_STAR,
                            reason: "Received 5-star review",
                        }),
                    });
                }
            }
        }
    } catch (e) {
        console.error("Points award failed:", e);
        // Don't fail the request if points/stats update fails, but log it
    }

    return Response.json({ success: true });
}
