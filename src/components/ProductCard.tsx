"use client";

import Link from "next/link";
import { Star, Heart } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useCart } from "@/store/cart";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = Readonly<{
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  rating?: number | null;
  category?: string;
  originalPrice?: number;
  store_id?: string; // Optional for compatibility but preferred
}>;

export default function ProductCard({ p }: { p: Product }) {
  const addToCart = useCart((s) => s.add);
  const toast = useToast();
  const hasDiscount = p.originalPrice && p.originalPrice > p.price;
  const discountPercent = hasDiscount
    ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();

    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      storeId: p.store_id || "",
      imageUrl: p.image_url || undefined,
      currency: "SOL", // Default to SOL for now if not in Product type in ProductCard
    });

    toast.success("Added to cart", p.name);
  };

  const { address } = useWalletAuth(); // Use the hook to get address

  const [isWishlisted, setIsWishlisted] = useState(false);
  const router = useRouter();

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Optimistic update
    const previousState = isWishlisted;
    setIsWishlisted(!previousState);

    try {
      if (!previousState) {
        // Add to wishlist
        await fetch('/api/wishlist', {
          method: 'POST',
          body: JSON.stringify({ address, productId: p.id })
        });
        toast.success("Added to wishlist");
      } else {
        // Remove from wishlist
        await fetch(`/api/wishlist?address=${address}&productId=${p.id}`, {
          method: 'DELETE'
        });
        toast.success("Removed from wishlist");
      }
    } catch (error) {
      // Revert on error
      setIsWishlisted(previousState);
      toast.error("Failed to update wishlist");
    }
  };

  return (
    <Link href={`/product/${p.id}`} className="block h-full">
      <div className="bg-white rounded-xl border border-border-gray overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col group relative">

        {/* Wishlist Button */}
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center hover:bg-white transition-all shadow-sm"
        >
          <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
        </button>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            {discountPercent}% OFF
          </div>
        )}

        {/* Product Image */}
        <div className="relative aspect-square bg-soft-gray-bg overflow-hidden">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-text text-sm">No image</span>
            </div>
          )}
        </div>


        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          {p.category && (
            <Badge variant="gray" className="mb-2">
              {p.category}
            </Badge>
          )}
          <h3 className="font-medium text-black text-sm line-clamp-2 mb-2 min-h-[40px]">
            {p.name}
          </h3>
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-black">
              {p.rating?.toFixed?.(1) ?? "4.5"}
            </span>
            <span className="text-xs text-muted-text ml-1">(127)</span>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-black">
                ${Number(p.price).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-text line-through">
                  ${p.originalPrice!.toFixed(2)}
                </span>
              )}
            </div>

            {hasDiscount && (
              <div className="text-xs text-green-600 font-medium">
                Save ${(p.originalPrice! - p.price).toFixed(2)}
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <div className="mt-3">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={handleAddToCart}
            >
              Add to cart
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
