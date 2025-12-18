"use client";

import { useEffect, useState } from "react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import Card from "@/components/ui/Card";
import { Heart, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/ProductCard";

export default function DashboardWishlistPage() {
  const auth = useWalletAuth();
  const [items, setItems] = useState<any[]>([]);
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
      const res = await fetch(`/api/wishlist?address=${auth.address}`);
      if (res.ok) {
        const data = await res.json();
        // Transform data if necessary or just set
        setItems(data.wishlist || []);
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
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Heart className="w-6 h-6 text-primary-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Wishlist</h1>
            <p className="text-muted-text">Your saved products</p>
          </div>
        </div>

        {/* Wishlist Grid */}
        {items.length === 0 ? (
          <Card>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        )}
      </div>
    </div>
  );
}
