import { getSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const adminAddress = searchParams.get("admin");
        const status = searchParams.get("status") || "pending";

        // Verify admin access
        requireAdmin(adminAddress);

        const supabase = getSupabaseServerClient();

        // Get withdrawal requests with seller details
        const { data: withdrawals, error } = await supabase
            .from("withdrawal_requests")
            .select("*")
            .eq("status", status)
            .order("requested_at", { ascending: true });

        if (error) {
            console.error("[Admin Withdrawals] Database error:", error);
            return Response.json(
                { ok: false, error: "Failed to fetch withdrawals" },
                { status: 500 }
            );
        }

        // Enrich with seller information
        const enrichedWithdrawals = await Promise.all(
            (withdrawals || []).map(async (w) => {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("name, email")
                    .eq("address", w.seller_address)
                    .single();

                return {
                    id: w.id,
                    sellerAddress: w.seller_address,
                    sellerName: profile?.name || "Unknown",
                    sellerEmail: profile?.email || "",
                    amount: parseFloat(w.amount),
                    currency: w.currency,
                    orderIds: w.order_ids || [],
                    orderCount: w.order_ids?.length || 0,
                    requestedAt: w.requested_at,
                    processedAt: w.processed_at,
                    completedAt: w.completed_at,
                    status: w.status,
                    transactionSignature: w.transaction_signature,
                    notes: w.notes,
                };
            })
        );

        return Response.json({
            ok: true,
            withdrawals: enrichedWithdrawals,
        });
    } catch (error: any) {
        console.error("[Admin Withdrawals] Error:", error);

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
