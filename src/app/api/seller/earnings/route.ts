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

        // Call the database function to get earnings
        const { data, error } = await supabase.rpc("get_seller_earnings", {
            p_seller_address: address,
        });

        if (error) {
            console.error("[Seller Earnings] Database error:", error);
            return Response.json(
                { ok: false, error: "Failed to calculate earnings" },
                { status: 500 }
            );
        }

        // If no data (no completed orders), return zeros
        if (!data || data.length === 0) {
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

        // Format the response
        const earnings = data[0];

        return Response.json({
            ok: true,
            earnings: {
                totalOrders: parseInt(earnings.total_orders) || 0,
                completedOrders: parseInt(earnings.completed_orders) || 0,
                totalRevenue: parseFloat(earnings.total_revenue) || 0,
                platformFee: parseFloat(earnings.platform_fee) || 0,
                sellerShare: parseFloat(earnings.seller_share) || 0,
                withdrawn: parseFloat(earnings.withdrawn) || 0,
                pendingWithdrawals: parseFloat(earnings.pending_withdrawals) || 0,
                available: parseFloat(earnings.available) || 0,
                currency: earnings.currency || "SOL",
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
