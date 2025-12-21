import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { address, amount, currency = "SOL" } = body;

        if (!address) {
            return Response.json(
                { ok: false, error: "Wallet address required" },
                { status: 401 }
            );
        }

        if (!amount || amount <= 0) {
            return Response.json(
                { ok: false, error: "Invalid withdrawal amount" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        // 1. Verify wallet address belongs to a seller
        const { data: profile } = await supabase
            .from("profiles")
            .select("address")
            .eq("address", address)
            .single();

        if (!profile) {
            return Response.json(
                { ok: false, error: "Profile not found" },
                { status: 404 }
            );
        }

        // 2. Check for existing pending/processing withdrawals
        const { data: pendingWithdrawal } = await supabase
            .from("withdrawal_requests")
            .select("id, status")
            .eq("seller_address", address)
            .in("status", ["pending", "processing"])
            .maybeSingle();

        if (pendingWithdrawal) {
            return Response.json(
                {
                    ok: false,
                    error: "You already have a pending withdrawal. Please wait for it to be processed."
                },
                { status: 400 }
            );
        }

        // 3. Calculate available earnings
        const { data: earningsData, error: earningsError } = await supabase
            .rpc("get_seller_earnings", { p_seller_address: address });

        if (earningsError || !earningsData || earningsData.length === 0) {
            console.error("[Withdraw] Earnings calculation error:", earningsError);
            return Response.json(
                { ok: false, error: "Failed to calculate earnings" },
                { status: 500 }
            );
        }

        const earnings = earningsData[0];
        const available = parseFloat(earnings.available) || 0;

        // 4. Validate withdrawal amount
        if (amount > available) {
            return Response.json(
                {
                    ok: false,
                    error: `Insufficient balance. Available: ${available} ${currency}`
                },
                { status: 400 }
            );
        }

        // Min withdrawal amount (optional)
        const MIN_WITHDRAWAL = 0.01;
        if (amount < MIN_WITHDRAWAL) {
            return Response.json(
                {
                    ok: false,
                    error: `Minimum withdrawal amount is ${MIN_WITHDRAWAL} ${currency}`
                },
                { status: 400 }
            );
        }

        // 5. Get eligible orders (completed, not withdrawn, belongs to seller's stores)
        const { data: stores } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_address", address);

        if (!stores || stores.length === 0) {
            return Response.json(
                { ok: false, error: "No stores found" },
                { status: 404 }
            );
        }

        const storeIds = stores.map(s => s.id);

        const { data: eligibleOrders } = await supabase
            .from("orders")
            .select("id, amount, currency")
            .in("store_id", storeIds)
            .eq("status", "completed")
            .eq("withdrawn", false)
            .eq("currency", currency)
            .order("created_at", { ascending: true });

        if (!eligibleOrders || eligibleOrders.length === 0) {
            return Response.json(
                { ok: false, error: "No completed orders available for withdrawal" },
                { status: 400 }
            );
        }

        // 6. Select orders that sum up to the withdrawal amount (with seller's share)
        let selectedAmount = 0;
        const selectedOrderIds: string[] = [];

        for (const order of eligibleOrders) {
            const sellerShare = parseFloat(order.amount) * 0.95;
            if (selectedAmount + sellerShare <= amount) {
                selectedOrderIds.push(order.id);
                selectedAmount += sellerShare;
            }
            if (selectedAmount >= amount) break;
        }

        if (selectedAmount < amount) {
            return Response.json(
                {
                    ok: false,
                    error: "Could not match order amounts to withdrawal request"
                },
                { status: 400 }
            );
        }

        // 7. Create withdrawal request
        const { data: withdrawal, error: withdrawalError } = await supabase
            .from("withdrawal_requests")
            .insert({
                seller_address: address,
                amount: amount,
                currency: currency,
                status: "pending",
                order_ids: selectedOrderIds,
                requested_at: new Date().toISOString(),
            })
            .select("id, status, requested_at")
            .single();

        if (withdrawalError || !withdrawal) {
            console.error("[Withdraw] Creation error:", withdrawalError);
            return Response.json(
                { ok: false, error: "Failed to create withdrawal request" },
                { status: 500 }
            );
        }

        // 8. Mark orders as in-withdrawal (set withdrawal_id)
        const { error: updateError } = await supabase
            .from("orders")
            .update({ withdrawal_id: withdrawal.id })
            .in("id", selectedOrderIds);

        if (updateError) {
            console.error("[Withdraw] Order update error:", updateError);
            // Rollback withdrawal request
            await supabase
                .from("withdrawal_requests")
                .delete()
                .eq("id", withdrawal.id);

            return Response.json(
                { ok: false, error: "Failed to process withdrawal" },
                { status: 500 }
            );
        }

        // Success!
        return Response.json({
            ok: true,
            withdrawal: {
                id: withdrawal.id,
                amount: amount,
                currency: currency,
                status: withdrawal.status,
                requestedAt: withdrawal.requested_at,
                orderCount: selectedOrderIds.length,
                estimatedProcessing: "24-48 hours",
            },
        });

    } catch (error) {
        console.error("[Withdraw] Error:", error);
        return Response.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
