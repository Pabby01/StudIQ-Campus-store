import { getSessionWallet } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const sessionAddress = await getSessionWallet(req);
    if (!sessionAddress) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, email } = body;

    if (!amount || amount <= 0) {
      return Response.json({ ok: false, error: "Invalid amount" }, { status: 400 });
    }

    const passpointKey = process.env.PASSPOINT_SECRET_KEY || "";
    if (!passpointKey) {
      return Response.json({ ok: false, error: "Passpoint API keys not configured" }, { status: 500 });
    }

    const txRef = `DEP_${sessionAddress}_${amount}_${Date.now()}`;

    const passpointRes = await fetch("https://api.passpoint.dev/v1/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${passpointKey}`,
      },
      body: JSON.stringify({
        customer: {
          email: email || "user@studiq.fun", // Passpoint requires an email
        },
        amount: amount.toFixed(2),
        currency: "NGN",
        reference: txRef,
      }),
    });

    if (!passpointRes.ok) {
      const errData = await passpointRes.text();
      console.error("Passpoint API error:", errData);
      return Response.json({ ok: false, error: "Failed to initialize Passpoint" }, { status: 500 });
    }

    const passpointData = await passpointRes.json();
    const payUrl = passpointData?.data?.url || passpointData?.data?.checkout_url || passpointData?.url;

    if (!payUrl) {
      console.error("Passpoint API missing URL:", passpointData);
      return Response.json({ ok: false, error: "Invalid response from Passpoint" }, { status: 500 });
    }

    return Response.json({ ok: true, checkout_url: payUrl });

  } catch (error) {
    console.error("Deposit API error:", error);
    return Response.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
