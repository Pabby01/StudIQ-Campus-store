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

        // 1. Get all stores owned by this seller
        const { data: stores, error: storesError } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_address", address);

        if (storesError) {
            console.error("[Seller Earnings] Stores fetch error:", storesError);
            return Response.json(
                { ok: false, error: "Failed to fetch stores" },
                { status: 500 }
            );
        }

        if (!stores || stores.length === 0) {
            // No stores = no earnings
            return Response.json({
                ok: true,
                earnings: {
                    totalOrders: 0,
                    completedOrders: 0,
                    totalRevenue: 0,
                    platformFee: 0,
                    sellerShare: 0,
                    withdrawn: 0,
                    pendingWithdrawals: 0,
                    available: 0,
                    currency: "SOL",
                },
            });
        }

        const storeIds = stores.map(s => s.id);

        // 2. Get all orders for these stores
        const { data: allOrders } = await supabase
            .from("orders")
            .select("id, status, amount, currency, withdrawn, withdrawal_id")
            .in("store_id", storeIds);

        // 3. Get completed orders
        const { data: completedOrders } = await supabase
            .from("orders")
            .select("id, amount, currency, withdrawn")
            .in("store_id", storeIds)
            .eq("status", "completed");

        // 4. Get total withdrawn (completed withdrawals)
        const { data: completedWithdrawals } = await supabase
            .from("withdrawal_requests")
            .select("amount, currency")
            .eq("seller_address", address)
            .eq("status", "completed");

        // 5. Get pending withdrawals
        const { data: pendingWithdrawals } = await supabase
            .from("withdrawal_requests")
            .select("amount, currency")
            .eq("seller_address", address)
            .in("status", ["pending", "processing"]);

        // Calculate totals (assuming SOL for now, can be extended for multi-currency)
        const totalOrders = allOrders?.length || 0;
        const completedCount = completedOrders?.length || 0;

        const totalRevenue = completedOrders?.reduce((sum, order) => {
            return sum + (parseFloat(order.amount.toString()) || 0);
        }, 0) || 0;

        const platformFee = totalRevenue * 0.05; // 5% fee
        const sellerShare = totalRevenue * 0.95; // 95% for seller

        const withdrawnAmount = completedWithdrawals?.reduce((sum, w) => {
            return sum + (parseFloat(w.amount.toString()) || 0);
        }, 0) || 0;

        const pendingAmount = pendingWithdrawals?.reduce((sum, w) => {
            return sum + (parseFloat(w.amount.toString()) || 0);
        }, 0) || 0;

        const available = sellerShare - withdrawnAmount - pendingAmount;

        // Get currency from first order or default to SOL
        const currency = completedOrders && completedOrders.length > 0
            ? completedOrders[0].currency
            : "SOL";

        return Response.json({
            ok: true,
            earnings: {
                totalOrders,
                completedOrders: completedCount,
                totalRevenue,
                platformFee,
                sellerShare,
                withdrawn: withdrawnAmount,
                pendingWithdrawals: pendingAmount,
                available: Math.max(0, available), // Ensure non-negative
                currency,
            },
        });
    } catch (error) {
        console.error("[Seller Earnings] Error:", error);
        return Response.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
