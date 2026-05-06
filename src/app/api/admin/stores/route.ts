import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("stores")
      .select("*, profiles(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Stores fetch error:", error);
      return Response.json(
        { ok: false, error: "Failed to fetch stores" },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      stores: data || [],
    });
  } catch (error) {
    console.error("Stores fetch error:", error);
    return Response.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
