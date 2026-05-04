import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { VerificationBadgeType } from "@/components/SellerVerificationBadge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SellerMetrics {
  sellerId: string;
  sellerTier: 'free' | 'premium' | 'enterprise';
  totalSales: number;
  averageRating: number;
  totalReviews: number;
  responseTime?: number; // days
  completionRate?: number; // percentage
}

async function getSellerMetrics(storeId: string): Promise<SellerMetrics | null> {
  try {
    // Get store info and seller tier
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("owner_address, total_sales")
      .eq("id", storeId)
      .single();

    if (storeError || !store) return null;

    // Get seller tier from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("seller_tier")
      .eq("address", store.owner_address)
      .single();

    if (profileError || !profile) return null;

    // Get average rating and review count for all products in this store
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, rating")
      .eq("store_id", storeId);

    if (productsError) return null;

    let totalReviews = 0;
    let sumRating = 0;

    if (products && products.length > 0) {
      for (const product of products) {
        const { data: reviews, error: reviewsError } = await supabase
          .from("reviews")
          .select("rating")
          .eq("product_id", product.id);

        if (!reviewsError && reviews) {
          totalReviews += reviews.length;
          sumRating += reviews.reduce((sum, r) => sum + r.rating, 0);
        }
      }
    }

    const averageRating = totalReviews > 0 ? sumRating / totalReviews : 0;

    return {
      sellerId: store.owner_address,
      sellerTier: profile.seller_tier as 'free' | 'premium' | 'enterprise',
      totalSales: store.total_sales || 0,
      averageRating,
      totalReviews,
      responseTime: 2, // Would need to calculate from orders
      completionRate: 95, // Would need to calculate from orders
    };
  } catch (error) {
    console.error("Error fetching seller metrics:", error);
    return null;
  }
}

function determineBadges(metrics: SellerMetrics): VerificationBadgeType[] {
  const badges: VerificationBadgeType[] = [];

  // Premium seller badge
  if (metrics.sellerTier === 'premium' || metrics.sellerTier === 'enterprise') {
    badges.push('premium');
  }

  // Verified badge (high review count + good rating)
  if (metrics.totalReviews >= 5 && metrics.averageRating >= 4.0) {
    badges.push('verified');
  }

  // Trusted badge (excellent rating + many sales)
  if (metrics.averageRating >= 4.7 && metrics.totalSales >= 10) {
    badges.push('trusted');
  }

  // Top seller badge (many sales + excellent rating)
  if (metrics.totalSales >= 20 && metrics.averageRating >= 4.5) {
    badges.push('top_seller');
  }

  // Fast responder badge (quick response time)
  if (metrics.responseTime && metrics.responseTime <= 2 && metrics.completionRate && metrics.completionRate >= 95) {
    badges.push('fast_responder');
  }

  return badges;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID required" },
        { status: 400 }
      );
    }

    const metrics = await getSellerMetrics(storeId);

    if (!metrics) {
      return NextResponse.json({ badges: [] });
    }

    const badges = determineBadges(metrics);

    return NextResponse.json({
      badges,
      metrics: {
        totalSales: metrics.totalSales,
        averageRating: metrics.averageRating.toFixed(1),
        totalReviews: metrics.totalReviews,
        sellerTier: metrics.sellerTier,
      },
    });
  } catch (error) {
    console.error("Error determining seller badges:", error);
    return NextResponse.json(
      { error: "Failed to determine seller badges", badges: [] },
      { status: 500 }
    );
  }
}
