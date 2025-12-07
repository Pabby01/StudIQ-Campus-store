import { getSupabaseServerClient } from "@/lib/supabase";
import { checkoutCreateSchema } from "@/lib/validators";
import { getSessionWalletFromReq } from "@/lib/session";

export async function POST(req: Request) {
  const address = getSessionWalletFromReq(req);
  if (!address) return Response.json({ ok: false }, { status: 401 });
  const body = await req.json();
  const parsed = checkoutCreateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const supabase = getSupabaseServerClient();
  const items = parsed.data.items;
  const { data: prods } = await supabase.from("products").select("id, price, store_id").in("id", items.map((i) => i.productId));
  if (!prods || prods.length !== items.length) return Response.json({ ok: false }, { status: 400 });
  const storeId = prods[0].store_id;
  const { data: store } = await supabase.from("stores").select("owner_address").eq("id", storeId).single();
  const { data: profile } = await supabase.from("profiles").select("seller_tier").eq("address", store?.owner_address ?? "").single();
  const feePercent = profile?.seller_tier === "premium" ? 3 : 10;
  const amount = items.reduce((sum, i) => {
    const p = prods.find((pp) => pp.id === i.productId)!;
    return sum + Number(p.price) * i.qty;
  }, 0);
  const feeAmount = amount * (feePercent / 100);
  const vendorEarnings = amount - feeAmount;
  const { data: order } = await supabase
    .from("orders")
    .insert({ buyer_address: address, store_id: storeId, amount, fee_percent: feePercent, fee_amount: feeAmount, vendor_earnings: vendorEarnings })
    .select("id")
    .single();
  if (order?.id) {
    const itemsRows = items.map((i) => {
      const p = prods.find((pp) => pp.id === i.productId)!;
      return { order_id: order.id, product_id: i.productId, qty: i.qty, price: Number(p.price) };
    });
    await supabase.from("order_items").insert(itemsRows);
  }
  return Response.json({ ok: true, orderId: order?.id, currency: parsed.data.currency, payTo: store?.owner_address ?? null });
}
