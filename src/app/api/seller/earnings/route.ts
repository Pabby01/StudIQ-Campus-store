import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request) {
    try {
        const address = await getSessionWallet(req);

        if (!address) {
            return Response.json(
                { ok: false, error: "Unauthorized: Active session required" },
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

        // 5. Get user's active subscription to determine platform fee
        const { data: subscription } = await supabase
            .from("user_subscriptions")
            .select("plan_id")
            .eq("user_address", address)
            .eq("status", "active")
            .gte("expires_at", new Date().toISOString())
            .maybeSingle();

        // Determine fee percentage
        // Default to Free (5%) if no subscription
        let feePercentage = 0.05;

        if (subscription?.plan_id) {
            // Map plan IDs to fee percentages
            // Ideally import SUBSCRIPTION_PLANS but simpler to map here or fetch plan details
            // Assuming plan_id matches keys in SUBSCRIPTION_PLANS or we fetch plan details
            // Let's safe fetch plan details if we have the ID, or just map common IDs
            if (subscription.plan_id === 'premium_monthly' || subscription.plan_id === 'premium_yearly' || subscription.plan_id === 'premium') feePercentage = 0.02;
            else if (subscription.plan_id === 'enterprise_monthly' || subscription.plan_id === 'enterprise_yearly' || subscription.plan_id === 'enterprise') feePercentage = 0.00;
        }

        // Calculate for SOL
        const solOrders = completedOrders?.filter(o => o.currency === "SOL") || [];
        const solRevenue = solOrders.reduce((sum, order) => {
            return sum + (parseFloat(order.amount.toString()) || 0);
        }, 0);
        const solPlatformFee = solRevenue * feePercentage;
        const solSellerShare = solRevenue * (1 - feePercentage);

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
        const usdcPlatformFee = usdcRevenue * feePercentage;
        const usdcSellerShare = usdcRevenue * (1 - feePercentage);

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
