import { getSessionWallet } from "@/lib/session";

export async function POST(req: Request) {
  const address = await getSessionWallet(req);
  if (!address) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(
    { ok: false, error: "Deprecated endpoint. Use /api/checkout/verify-transaction." },
    { status: 410 }
  );
}
