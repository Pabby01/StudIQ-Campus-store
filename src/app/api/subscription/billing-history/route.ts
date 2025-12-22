import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/subscription/billing-history?address=xxx
export async function GET(req: Request) {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    try {
        // Get all subscription transactions for this user
        // Don't join with subscription_plans to avoid schema issues
        const { data: transactions, error } = await supabase
            .from("subscription_transactions")
            .select("*")
            .eq("user_address", address)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching billing history:", error);
            return NextResponse.json(
                { error: "Failed to fetch billing history" },
                { status: 500 }
            );
        }

        // Get plan names separately if needed
        const planIds = [...new Set((transactions || []).map(t => t.plan_id).filter(Boolean))];
        let planNames: Record<string, string> = {};

        if (planIds.length > 0) {
            const { data: plans } = await supabase
                .from("subscription_plans")
                .select("id, name")
                .in("id", planIds);

            if (plans) {
                planNames = plans.reduce((acc, plan) => {
                    acc[plan.id] = plan.name;
                    return acc;
                }, {} as Record<string, string>);
            }
        }

        // Format transactions for display
        const formattedTransactions = (transactions || []).map((tx) => ({
            id: tx.id,
            date: tx.created_at,
            planName: planNames[tx.plan_id] || 'Unknown',
            cycle: tx.billing_cycle,
            amount: tx.amount,
            currency: tx.currency,
            status: tx.status,
            txSignature: tx.tx_signature,
        }));

        return NextResponse.json({
            transactions: formattedTransactions,
            total: formattedTransactions.length,
        });
    } catch (error) {
        console.error("Billing history error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
