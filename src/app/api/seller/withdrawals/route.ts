import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get("address");

        if (!address) {
            return Response.json(
                { ok: false, error: "Wallet address required" },
                { status: 401 }
            );
        }

        const supabase = getSupabaseServerClient();

        // Fetch all withdrawal requests for this seller
        const { data: withdrawals, error } = await supabase
            .from("withdrawal_requests")
            .select("*")
            .eq("seller_address", address)
            .order("requested_at", { ascending: false });

        if (error) {
            console.error("[Withdrawal History] Database error:", error);
            return Response.json(
                { ok: false, error: "Failed to fetch withdrawal history" },
                { status: 500 }
            );
        }

        // Format the response
        const formattedWithdrawals = (withdrawals || []).map((w) => ({
            id: w.id,
            amount: parseFloat(w.amount),
            currency: w.currency,
            status: w.status,
            requestedAt: w.requested_at,
            processedAt: w.processed_at,
            completedAt: w.completed_at,
            transactionSignature: w.transaction_signature,
            orderCount: w.order_ids?.length || 0,
            notes: w.notes,
        }));

        return Response.json({
            ok: true,
            withdrawals: formattedWithdrawals,
        });

    } catch (error) {
        console.error("[Withdrawal History] Error:", error);
        return Response.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
