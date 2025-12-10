import { getSupabaseServerClient } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json([]);
  }
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("reviews").select("*").eq("product_id", params.id).order("created_at", { ascending: false });
  return Response.json(data ?? []);
}
