import { getSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request) {
    try {
        const address = await getSessionWallet(req);

        await requireAdmin(address);

        const { searchParams } = new URL(req.url);
        const range = parseInt(searchParams.get("range") || "30");
        const limit = parseInt(searchParams.get("limit") || "100");

        const supabase = getSupabaseServerClient();

        const rangeDate = new Date();
        rangeDate.setDate(rangeDate.getDate() - range);

        const { data } = await supabase
            .from("ramp_transactions")
            .select("*")
            .gte("created_at", rangeDate.toISOString())
            .order("created_at", { ascending: false })
            .limit(limit);

        const transactions = (data || []).map((tx: any) => ({
            id: tx.id,
            pajId: tx.paj_id,
            userAddress: tx.user_address,
            type: tx.type,
            fiatAmount: typeof tx.fiat_amount === "number" ? tx.fiat_amount : parseFloat(tx.fiat_amount || "0"),
            cryptoAmount: tx.crypto_amount,
            currency: tx.currency,
            status: tx.status,
            mint: tx.mint,
            txSignature: tx.tx_signature,
            createdAt: tx.created_at,
            updatedAt: tx.updated_at,
        }));

        return Response.json({
            ok: true,
            transactions,
        });
    } catch (error: any) {
        console.error("[Admin Paj Transactions] Error:", error);

        if (error.message?.includes("Unauthorized")) {
            return Response.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        return Response.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

