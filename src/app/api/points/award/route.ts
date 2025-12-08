import { getSupabaseServerClient } from "@/lib/supabase";
import { awardPointsSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = awardPointsSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Get current points
    const { data: current } = await supabase
      .from("profiles")
      .select("points")
      .eq("address", parsed.data.address)
      .maybeSingle();

    const basePoints = Number(current?.points ?? 0);
    const newPoints = basePoints + parsed.data.points;

    // Update points
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ points: newPoints })
      .eq("address", parsed.data.address);

    if (updateError) {
      console.error("Points update error:", updateError);
      return Response.json(
        { ok: false, error: "Failed to update points" },
        { status: 500 }
      );
    }

    // Log the points award
    const { error: logError } = await supabase
      .from("points_log")
      .insert({
        address: parsed.data.address,
        points: parsed.data.points,
        reason: parsed.data.reason,
      });

    if (logError) {
      console.error("Points log error:", logError);
    }

    return Response.json({
      ok: true,
      newTotal: newPoints,
      awarded: parsed.data.points,
    });
  } catch (error) {
    console.error("Points award error:", error);
    return Response.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
