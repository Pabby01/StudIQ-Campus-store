import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );
    }

    // Fetch the most recent review with profile info
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id,
        rating,
        content,
        created_at,
        reviewer_address,
        profiles(name)
      `
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No reviews found
        return NextResponse.json({ review: null });
      }
      throw error;
    }

    if (!data) {
      return NextResponse.json({ review: null });
    }

    // Handle nested profile data
    const profileData = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
    const reviewerName = profileData?.name || `${data.reviewer_address?.slice(0, 4)}...${data.reviewer_address?.slice(-4)}`;

    return NextResponse.json({
      review: {
        id: data.id,
        rating: data.rating,
        content: data.content?.substring(0, 80) + (data.content?.length > 80 ? "..." : ""),
        createdAt: data.created_at,
        reviewerName,
      },
    });
  } catch (error) {
    console.error("Error fetching review snippet:", error);
    return NextResponse.json(
      { error: "Failed to fetch review snippet" },
      { status: 500 }
    );
  }
}
