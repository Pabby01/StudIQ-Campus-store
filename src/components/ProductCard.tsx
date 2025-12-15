"use client";

import Link from "next/link";
import { Star, Heart } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PremiumBadge from "@/components/PremiumBadge";
import { useCart } from "@/store/cart";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = Readonly<{
  id: string;
  name: string;
  price: number;
  currency?: "SOL" | "USDC";
  image_url?: string | null;
  rating?: number | null;
  category?: string;
  originalPrice?: number;
  store_id?: string;
  inventory?: number; // Stock count
  owner_address?: string; // Seller's address
  isPremiumSeller?: boolean; // Whether seller has premium subscription
}>;

export default function ProductCard({ p }: { p: Product }) {
  const addToCart = useCart((s) => s.add);
  const toast = useToast();
  const hasDiscount = p.originalPrice && p.originalPrice > p.price;
  const discountPercent = hasDiscount
    ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)
    : 0;

  const { address } = useWalletAuth();

  // Check if product is sold out
  const isSoldOut = p.inventory !== undefined && p.inventory <= 0;

  // Check if current user is the seller
  const isOwnProduct = address && p.owner_address && address === p.owner_address;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSoldOut) {
      toast.error("Product is sold out");
      return;
    }

    if (isOwnProduct) {
      toast.error("You cannot purchase your own product");
      return;
    }

    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      storeId: p.store_id || "",
      imageUrl: p.image_url || undefined,
      currency: p.currency || "SOL",
    });

    toast.success("Added to cart", p.name);
  };

  const [isWishlisted, setIsWishlisted] = useState(false);
  const router = useRouter();

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (isOwnProduct) {
      toast.error("Cannot wishlist your own product");
      return;
    }

    const previousState = isWishlisted;
    setIsWishlisted(!previousState);

    try {
      if (!previousState) {
        await fetch('/api/wishlist', {
          method: 'POST',
          body: JSON.stringify({ address, productId: p.id })
        });
        toast.success("Added to wishlist");
      } else {
        await fetch(`/api/wishlist?address=${address}&productId=${p.id}`, {
          method: 'DELETE'
        });
        toast.success("Removed from wishlist");
      }
    } catch (error) {
      setIsWishlisted(previousState);
      toast.error("Failed to update wishlist");
    }
  };

  return (
    <Link href={`/product/${p.id}`} className="block h-full">
      <div className="bg-white rounded-xl border border-border-gray overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col group relative">

        {/* Wishlist Button - Hidden for own products */}
        {!isOwnProduct && (
          <button
            onClick={toggleWishlist}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center hover:bg-white transition-all shadow-sm"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
          </button>
        )}

        {/* Sold Out Badge */}
        {isSoldOut && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg z-10 shadow-lg">
            SOLD OUT
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && !isSoldOut && (
          <Badge variant="green" className="absolute top-3 left-3 font-bold shadow-md">
            {discountPercent}% OFF
          </Badge>
        )}

        {/* Image */}
        <div className="relative w-full pt-[100%] bg-gray-100 overflow-hidden">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Premium Badge + Category */}
          <div className="flex items-center justify-between mb-2">
            {p.category && (
              <span className="text-xs text-muted-text uppercase tracking-wide">
                {p.category}
              </span>
            )}
            {p.isPremiumSeller && (
              <PremiumBadge size="sm" />
            )}
          </div>
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
                {p.currency === "SOL"
                  ? `${Number(p.price).toFixed(2)} SOL`
                  : `$${Number(p.price).toFixed(2)}`
                }
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-text line-through">
                  {p.currency === "SOL"
                    ? `${p.originalPrice!.toFixed(2)} SOL`
                    : `$${p.originalPrice!.toFixed(2)}`
                  }
                </span>
              )}
            </div>

            {hasDiscount && (
              <div className="text-xs text-green-600 font-medium">
                Save {p.currency === "SOL"
                  ? `${(p.originalPrice! - p.price).toFixed(2)} SOL`
                  : `$${(p.originalPrice! - p.price).toFixed(2)}`
                }
              </div>
            )}
          </div>

          {/* Stock Count - Show for sellers */}
          {isOwnProduct && p.inventory !== undefined && (
            <div className="mt-2 text-xs text-muted-text">
              Stock: {p.inventory} {p.inventory === 1 ? 'unit' : 'units'}
            </div>
          )}

          {/* Add to Cart Button or Sold Out / Own Product Message */}
          <div className="mt-3">
            {isSoldOut ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full cursor-not-allowed opacity-60"
                disabled
              >
                Sold Out
              </Button>
            ) : isOwnProduct ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full cursor-not-allowed"
                disabled
              >
                Your Product
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleAddToCart}
              >
                Add to cart
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
