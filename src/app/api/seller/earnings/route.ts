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
                    sol: {
                        totalOrders: 0,
                        completedOrders: 0,
                        totalRevenue: 0,
                        platformFee: 0,
                        sellerShare: 0,
                        withdrawn: 0,
                        pendingWithdrawals: 0,
                        available: 0,
                    },
                    usdc: {
                        totalOrders: 0,
                        completedOrders: 0,
                        totalRevenue: 0,
                        platformFee: 0,
                        sellerShare: 0,
                        withdrawn: 0,
                        pendingWithdrawals: 0,
                        available: 0,
                    },
                    combined: {
                        totalOrders: 0,
                        completedOrders: 0,
                    },
                },
            });
        }

        const storeIds = stores.map(s => s.id);

        // 2. Get all orders for these stores
        const { data: allOrders } = await supabase
            .from("orders")
            .select("id, status, amount, currency, withdrawn, withdrawal_id")
            .in("store_id", storeIds);

        // 3. Get completed orders separated by currency
        const { data: completedOrders } = await supabase
            .from("orders")
            .select("id, amount, currency, withdrawn")
            .in("store_id", storeIds)
            .eq("status", "completed");

        // 4. Get withdrawals separated by currency
        const { data: completedWithdrawals } = await supabase
            .from("withdrawal_requests")
            .select("amount, currency")
            .eq("seller_address", address)
            .eq("status", "completed");

        const { data: pendingWithdrawals } = await supabase
            .from("withdrawal_requests")
            .select("amount, currency")
            .eq("seller_address", address)
            .in("status", ["pending", "processing"]);

        // Calculate for SOL
        const solOrders = completedOrders?.filter(o => o.currency === "SOL") || [];
        const solRevenue = solOrders.reduce((sum, order) => {
            return sum + (parseFloat(order.amount.toString()) || 0);
        }, 0);
        const solPlatformFee = solRevenue * 0.05;
        const solSellerShare = solRevenue * 0.95;

        const solWithdrawn = completedWithdrawals
            ?.filter(w => w.currency === "SOL")
            .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0;

        const solPending = pendingWithdrawals
            ?.filter(w => w.currency === "SOL")
            .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0;

        const solAvailable = solSellerShare - solWithdrawn - solPending;

        // Calculate for USDC
        const usdcOrders = completedOrders?.filter(o => o.currency === "USDC") || [];
        const usdcRevenue = usdcOrders.reduce((sum, order) => {
            return sum + (parseFloat(order.amount.toString()) || 0);
        }, 0);
        const usdcPlatformFee = usdcRevenue * 0.05;
        const usdcSellerShare = usdcRevenue * 0.95;

        const usdcWithdrawn = completedWithdrawals
            ?.filter(w => w.currency === "USDC")
            .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0;

        const usdcPending = pendingWithdrawals
            ?.filter(w => w.currency === "USDC")
            .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0;

        const usdcAvailable = usdcSellerShare - usdcWithdrawn - usdcPending;

        return Response.json({
            ok: true,
            earnings: {
                sol: {
                    totalOrders: allOrders?.filter(o => o.currency === "SOL").length || 0,
                    completedOrders: solOrders.length,
                    totalRevenue: solRevenue,
                    platformFee: solPlatformFee,
                    sellerShare: solSellerShare,
                    withdrawn: solWithdrawn,
                    pendingWithdrawals: solPending,
                    available: Math.max(0, solAvailable),
                },
                usdc: {
                    totalOrders: allOrders?.filter(o => o.currency === "USDC").length || 0,
                    completedOrders: usdcOrders.length,
                    totalRevenue: usdcRevenue,
                    platformFee: usdcPlatformFee,
                    sellerShare: usdcSellerShare,
                    withdrawn: usdcWithdrawn,
                    pendingWithdrawals: usdcPending,
                    available: Math.max(0, usdcAvailable),
                },
                combined: {
                    totalOrders: allOrders?.length || 0,
                    completedOrders: completedOrders?.length || 0,
                },
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
