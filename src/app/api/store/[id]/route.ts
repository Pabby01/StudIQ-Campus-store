import { getSupabaseServerClient } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("stores").select("*, products(*)").eq("id", params.id).single();
  return Response.json(data);
}
