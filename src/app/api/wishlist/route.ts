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

    // Flatten the response slightly for easier consumption if needed, or just return as is
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
            // Ignore duplicate errors silently or return specific code
            if (error.code === '23505') { // Unique violation
                return Response.json({ ok: true, message: "Already in wishlist" });
            }
            throw error;
        }

        return Response.json({ ok: true });
    } catch (error) {
        console.error("Wishlist add error:", error);
        return Response.json({ error: "Failed to add to wishlist" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const address = url.searchParams.get("address");
        const productId = url.searchParams.get("productId");

        if (!address || !productId) {
            return Response.json({ error: "Missing address or productId" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        const { error } = await supabase
            .from("wishlist")
            .delete()
            .match({ user_address: address, product_id: productId });

        if (error) throw error;

        return Response.json({ ok: true });
    } catch (error) {
        console.error("Wishlist remove error:", error);
        return Response.json({ error: "Failed to remove from wishlist" }, { status: 500 });
    }
}
