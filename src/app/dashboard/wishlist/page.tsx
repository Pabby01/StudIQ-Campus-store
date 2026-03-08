"use client";

import { useEffect, useState } from "react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import Card from "@/components/ui/Card";
import { Heart, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";

type WishlistProduct = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  category?: string;
  rating?: number | null;
};

type WishlistItem = {
  id: string;
  product: WishlistProduct;
};

export default function DashboardWishlistPage() {
  const auth = useWalletAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.address) {
      fetchWishlist();
    } else if (!auth.connecting && !auth.address) {
      setLoading(false);
    }
  }, [auth.address, auth.connecting]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`/api/wishlist?address=${auth.address}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // Transform data if necessary or just set
        const nextItems = ((data.wishlist || []) as WishlistItem[]).map((item) => ({
          ...item,
          product: {
            ...item.product,
            category: item.product?.category ?? undefined,
          },
        }));
        setItems(nextItems);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    // Optimistic update
    setItems(prev => prev.filter(i => i.product.id !== productId));

    try {
      await fetch(`/api/wishlist?address=${auth.address}&productId=${productId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("Failed to remove", err);
      fetchWishlist(); // Revert on error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg mesh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 py-6 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="glass-panel rounded-3xl p-5 sm:p-6 flex items-center gap-3"
        >
          <div className="p-2 bg-white/85 rounded-2xl border border-white/70">
            <Heart className="w-5 h-5 text-primary-blue" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold text-black truncate">Wishlist</h1>
            <p className="text-sm text-muted-text">Your saved products</p>
          </div>
        </motion.div>

        {/* Wishlist Grid */}
        {items.length === 0 ? (
          <Card className="border-white/60">
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-muted-text mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No items in wishlist</h3>
              <p className="text-muted-text mb-6">Save products you like to view them later</p>
              <Link href="/search">
                <Button variant="primary">Browse Products</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {items.map((item) => (
              <div key={item.id} className="relative group">
                <ProductCard p={item.product} />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromWishlist(item.product.id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
