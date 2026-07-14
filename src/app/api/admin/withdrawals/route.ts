import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const offset = (page - 1) * limit;

    let query = supabase
      .from("withdrawals")
      .select("*, stores(name)")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: withdrawals, error, count } = await query;

    if (error) throw error;

    // Format response
    const formattedWithdrawals = (withdrawals || []).map((w: any) => ({
      id: w.id,
      storeId: w.store_id,
      storeName: w.stores?.name || "Unknown",
      amount: w.amount,
      status: w.status,
      method: w.method || "Bank Transfer",
      accountDetails: w.account_details || "",
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    }));

    // Calculate stats
    const { data: allWithdrawals } = await supabase
      .from("withdrawals")
      .select("amount, status");

    const totalWithdrawals = allWithdrawals?.length || 0;
    const totalAmount = (allWithdrawals || []).reduce(
      (sum, w) => sum + (w.amount || 0),
      0
    );
    const completedWithdrawals = (allWithdrawals || []).filter(
      (w) => w.status === "completed"
    ).length;
    const pendingWithdrawals = (allWithdrawals || []).filter(
      (w) => w.status === "pending"
    ).length;
    const failedWithdrawals = (allWithdrawals || []).filter(
      (w) => w.status === "failed"
    ).length;

    return NextResponse.json({
      withdrawals: formattedWithdrawals,
      total: count || 0,
      totalWithdrawals,
      totalAmount: Math.round(totalAmount),
      completedWithdrawals,
      pendingWithdrawals,
      failedWithdrawals,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}
