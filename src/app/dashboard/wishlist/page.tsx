"use client";

import useSWR from "swr";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import ProductCard from "@/components/ProductCard";

type WishlistItem = Readonly<{ product_id: string; products: { id: string; name: string; price: number; image_url?: string | null; rating?: number | null } }>;

export default function WishlistPage() {
  const auth = useWalletAuth();
  const { data } = useSWR<WishlistItem[]>(auth.address ? `/api/wishlist/list?address=${auth.address}` : null, async (url: string) => (await fetch(url)).json());
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Wishlist</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((w) => (
          <ProductCard key={w.product_id} p={w.products} />
        ))}
      </div>
    </div>
  );
}
