import { getSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const adminAddress = searchParams.get("admin");
        const range = parseInt(searchParams.get("range") || "30");
        const limit = parseInt(searchParams.get("limit") || "100");

        // Verify admin access
        requireAdmin(adminAddress);

        const supabase = getSupabaseServerClient();

        // Get recent orders with details
        const rangeDate = new Date();
        rangeDate.setDate(rangeDate.getDate() - range);

        const { data: orders } = await supabase
            .from("orders")
            .select("*")
            .gte("created_at", rangeDate.toISOString())
            .order("created_at", { ascending: false })
            .limit(limit);

        const transactions = (orders || []).map((order) => ({
            orderId: order.id,
            buyerAddress: order.buyer_address,
            storeId: order.store_id,
            amount: parseFloat(order.amount),
            platformFee: parseFloat(order.amount) * 0.05,
            sellerRevenue: parseFloat(order.amount) * 0.95,
            currency: order.currency,
            status: order.status,
            deliveryMethod: order.delivery_method,
            paymentMethod: order.payment_method,
            createdAt: order.created_at,
            withdrawn: order.withdrawn,
        }));

        return Response.json({
            ok: true,
            transactions,
        });
    } catch (error: any) {
        console.error("[Admin Transactions] Error:", error);

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
