import { getSupabaseServerClient } from "@/lib/supabase";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("id", params.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("stores")
    .update(body)
    .eq("id", params.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
