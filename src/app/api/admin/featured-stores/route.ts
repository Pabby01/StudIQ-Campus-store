import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const { updates } = await req.json();

    if (!Array.isArray(updates)) {
      return Response.json(
        { ok: false, error: "Updates must be an array" },
        { status: 400 }
      );
    }

    // Update each store
    for (const update of updates) {
      const { error } = await supabase
        .from("stores")
        .update({
          featured: update.featured,
          featured_order: update.featured_order,
          featured_at: update.featured ? new Date().toISOString() : null,
        })
        .eq("id", update.id);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }
    }

    return Response.json({ ok: true, message: "Featured stores updated" });
  } catch (error) {
    console.error("Featured stores update error:", error);
    return Response.json(
      { ok: false, error: "Failed to update featured stores" },
      { status: 500 }
    );
  }
}
