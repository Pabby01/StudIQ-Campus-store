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

    // Update product avg rating (simple approach)
    // Or trigger? Let's just create review for now.

    return Response.json({ success: true });
}
