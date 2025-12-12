import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 404 });
  }

  return Response.json(data);
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
