import { useState, useEffect } from 'react';
import type { VerificationBadgeType } from '@/components/SellerVerificationBadge';

interface SellerMetrics {
  totalSales: number;
  averageRating: string;
  totalReviews: number;
  sellerTier: 'free' | 'premium' | 'enterprise';
}

interface VerificationData {
  badges: VerificationBadgeType[];
  metrics: SellerMetrics;
}

export const useSellerVerification = (storeId: string | undefined) => {
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setData(null);
      return;
    }

    const fetchBadges = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/seller/verification-badges?storeId=${storeId}`);
        if (!res.ok) throw new Error('Failed to fetch badges');
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [storeId]);

  return { data, loading, error };
};
