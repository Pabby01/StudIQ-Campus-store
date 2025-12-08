import { getSupabaseServerClient } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const supabase = getSupabaseServerClient();

    // Fetch store with owner info
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("*, profiles(name, school)")
      .eq("id", params.id)
      .single();

    if (storeError || !store) {
      return Response.json(
        { ok: false, error: "Store not found" },
        { status: 404 }
      );
    }

    // Fetch products for this store
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", params.id)
      .order("created_at", { ascending: false });

    if (productsError) {
      console.error("Products fetch error:", productsError);
    }

    return Response.json({
      ok: true,
      store,
      products: products || [],
    });
  } catch (error) {
    console.error("Store detail fetch error:", error);
    return Response.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
