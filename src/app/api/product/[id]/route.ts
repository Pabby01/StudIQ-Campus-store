import { getSupabaseServerClient } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json(null);
  }
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("products").select("*, stores(*)").eq("id", params.id).single();
  return Response.json(data);
}
