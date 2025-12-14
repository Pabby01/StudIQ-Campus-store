import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
        return Response.json({ error: "Address required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
        .from("wishlist")
        .select(`
      id,
      created_at,
      product:products (
        id,
        name,
        price,
        image_url,
        rating,
        category,
        store:stores(name)
      )
    `)
        .eq("user_address", address)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Wishlist fetch error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ wishlist: data });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { address, productId } = body;

        if (!address || !productId) {
            return Response.json({ error: "Missing address or productId" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        const { error } = await supabase
            .from("wishlist")
            .insert({ user_address: address, product_id: productId });

        if (error) {
            if (error.code === '23505') {
                return Response.json({ ok: true, message: "Already in wishlist" });
            }
            throw error;
        }

        // Award 2 points for wishlist addition
        try {
            await fetch(`${req.headers.get("origin")}/api/points/award`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address,
                    points: 2,
                    reason: "Added to wishlist",
                }),
            });
        } catch (e) {
            console.error("Points award failed:", e);
        }

        return Response.json({ ok: true });
    } catch (error) {
        console.error("Wishlist add error:", error);
        return Response.json({ error: "Failed to add to wishlist" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");
    const productId = url.searchParams.get("productId");

    if (!address || !productId) {
        return Response.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_address", address)
        .eq("product_id", productId);

    if (error) {
        console.error("Wishlist delete error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
}
