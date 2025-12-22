import { getSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { admin, withdrawalId, action, transactionSignature, notes } = body;

        // Verify admin access
        requireAdmin(admin);

        if (!withdrawalId || !action) {
            return Response.json(
                { ok: false, error: "Withdrawal ID and action required" },
                { status: 400 }
            );
        }

        if (!["approve", "reject"].includes(action)) {
            return Response.json(
                { ok: false, error: "Action must be 'approve' or 'reject'" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        // Get withdrawal request
        const { data: withdrawal, error: fetchError } = await supabase
            .from("withdrawal_requests")
            .select("*")
            .eq("id", withdrawalId)
            .single();

        if (fetchError || !withdrawal) {
            return Response.json(
                { ok: false, error: "Withdrawal request not found" },
                { status: 404 }
            );
        }

        if (action === "approve") {
            // Require transaction signature for approval
            if (!transactionSignature) {
                return Response.json(
                    { ok: false, error: "Transaction signature required for approval" },
                    { status: 400 }
                );
            }

            // Update withdrawal to completed
            const { error: updateError } = await supabase
                .from("withdrawal_requests")
                .update({
                    status: "completed",
                    transaction_signature: transactionSignature,
                    completed_at: new Date().toISOString(),
                    processed_at: new Date().toISOString(),
                    notes: notes || "Approved by admin",
                })
                .eq("id", withdrawalId);

            if (updateError) {
                console.error("[Process Withdrawal] Update error:", updateError);
                return Response.json(
                    { ok: false, error: "Failed to update withdrawal" },
                    { status: 500 }
                );
            }

            // Mark associated orders as withdrawn
            const { error: ordersError } = await supabase
                .from("orders")
                .update({ withdrawn: true })
                .eq("withdrawal_id", withdrawalId);

            if (ordersError) {
                console.error("[Process Withdrawal] Orders update error:", ordersError);
            }

            return Response.json({
                ok: true,
                message: "Withdrawal approved successfully",
                withdrawal: {
                    id: withdrawalId,
                    status: "completed",
                    transactionSignature,
                },
            });

        } else if (action === "reject") {
            // Reject withdrawal
            const { error: updateError } = await supabase
                .from("withdrawal_requests")
                .update({
                    status: "rejected",
                    processed_at: new Date().toISOString(),
                    notes: notes || "Rejected by admin",
                })
                .eq("id", withdrawalId);

            if (updateError) {
                console.error("[Process Withdrawal] Reject error:", updateError);
                return Response.json(
                    { ok: false, error: "Failed to reject withdrawal" },
                    { status: 500 }
                );
            }

            // Release orders back (remove withdrawal_id)
            const { error: ordersError } = await supabase
                .from("orders")
                .update({ withdrawal_id: null })
                .eq("withdrawal_id", withdrawalId);

            if (ordersError) {
                console.error("[Process Withdrawal] Orders release error:", ordersError);
            }

            return Response.json({
                ok: true,
                message: "Withdrawal rejected successfully",
                withdrawal: {
                    id: withdrawalId,
                    status: "rejected",
                },
            });
        }

    } catch (error: any) {
        console.error("[Process Withdrawal] Error:", error);

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
