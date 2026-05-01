/* eslint-disable react-hooks/purity */
"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Heart } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PremiumBadge from "@/components/PremiumBadge";
import { useCart } from "@/store/cart";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = Readonly<{
  id: string;
  name: string;
  price: number;
  currency?: "USDC" | "USDT" | "SOL" | "USD";
  price_ngn?: number | null;
  priceNgn?: number | null;
  image_url?: string | null;
  rating?: number | null;
  category?: string;
  originalPrice?: number;
  original_price?: number;
  store_id?: string;
  inventory?: number;
  owner_address?: string;
  isPremiumSeller?: boolean;
  reviews_count?: number;
  stores?: { name: string } | null;
}>;

interface ProductCardProps {
  p: Product;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ProductCard({ p, onEdit, onDelete }: ProductCardProps) {
  const addToCart = useCart((s) => s.add);
  const toast = useToast();
  const router = useRouter();
  const { walletAddress: address } = useCivicWallet();

  const [isWishlisted, setIsWishlisted] = useState(false);

  const originalPrice = p.original_price || p.originalPrice;
  const displayPriceNgn = p.price_ngn ?? p.priceNgn ?? p.price;
  const displayOriginalPriceNgn = originalPrice && p.price ? (displayPriceNgn / p.price) * originalPrice : null;
  const hasDiscount = !!(displayOriginalPriceNgn && displayOriginalPriceNgn > displayPriceNgn);
  const discountPercent = hasDiscount
    ? Math.round(((displayOriginalPriceNgn! - displayPriceNgn) / displayOriginalPriceNgn!) * 100)
    : 0;

  const isSoldOut = p.inventory !== undefined && p.inventory <= 0;
  const isOwnProduct = !!(address && p.owner_address && address === p.owner_address);

  const formatNgn = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);

  const openDetails = () => {
    router.push(`/product/${p.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
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
      price: displayPriceNgn,
      storeId: p.store_id || "",
      imageUrl: p.image_url || undefined,
      currency: (p.currency as "USDC" | "USDT" | undefined) || "USDC",
      priceNgn: displayPriceNgn,
    });

    toast.success("Added to cart", p.name);
  };

  const toggleWishlist = async (e: React.MouseEvent<HTMLButtonElement>) => {
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
        await fetch("/api/wishlist", {
          method: "POST",
          body: JSON.stringify({ address, productId: p.id }),
        });
        toast.success("Added to wishlist");
      } else {
        await fetch(`/api/wishlist?address=${address}&productId=${p.id}`, {
          method: "DELETE",
        });
        toast.success("Removed from wishlist");
      }
    } catch (error) {
      setIsWishlisted(previousState);
      toast.error("Failed to update wishlist");
      console.error("[Wishlist] Failed to update wishlist:", error);
    }
  };

  return (
    <div className="h-full">
      <div
        className="bg-white rounded-[18px] border border-gray-200 overflow-hidden hover-lift h-full grid grid-rows-[2.4fr_2.6fr] sm:grid-rows-[3fr_2fr] group relative cursor-pointer shadow-sm min-h-[200px] sm:min-h-[230px] lg:min-h-[190px] aspect-[4/5] sm:aspect-[3/4]"
        onClick={openDetails}
      >
        {!isOwnProduct && (
          <button
            onClick={toggleWishlist}
            className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all shadow-sm border border-white/70"
          >
            <Heart className={`w-3 h-3 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"}`} />
          </button>
        )}

        {isSoldOut && (
          <div className="absolute top-10 left-2 bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full z-10 shadow-lg">
            SOLD OUT
          </div>
        )}

        {hasDiscount && !isSoldOut && (
          <Badge variant="green" className="absolute top-10 left-2 font-bold shadow-md rounded-full text-[8px] px-2 py-0.5">
            {discountPercent}% OFF
          </Badge>
        )}

        <div className="relative w-full bg-slate-50 overflow-hidden rounded-2xl m-2">
          {p.image_url ? (
            <Image
              src={p.image_url}
              alt={p.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Image</div>
          )}

          <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-full bg-white/90 px-1 py-0.5 text-[8px] font-semibold text-black shadow-sm border border-black/10">
            <Star className="w-2 h-2 fill-black text-black" />
            {p.rating?.toFixed?.(1) ?? "0.0"}
          </div>
        </div>

        <div className="px-3 pb-3 flex flex-col min-h-0 h-full">
          <div className="flex items-center justify-between mb-0.5">
            {p.category && (
              <span className="hidden sm:inline text-[7px] text-muted-text uppercase tracking-wide truncate pr-1">{p.category}</span>
            )}
            {p.isPremiumSeller && <PremiumBadge size="sm" />}
          </div>

          <p className="font-semibold text-black text-[10px] line-clamp-1 mb-0.5 min-h-[11px] leading-tight group-hover:text-black">{p.name}</p>

          {p.stores?.name && (
            <Link
              href={`/store/${p.store_id}`}
              className="text-[8px] text-primary-blue mb-0.5 hover:underline w-fit"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
            >
              {p.stores.name}
            </Link>
          )}

          <div className="space-y-0.5 mt-auto">
            <div className="text-[6px] text-muted-text min-h-[10px]">
              {hasDiscount && displayOriginalPriceNgn && (
                <span className="text-[8px] text-muted-text line-through hidden sm:inline">{formatNgn(displayOriginalPriceNgn)}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-1/2 flex items-baseline gap-1">
                <span className="text-[11px] font-bold text-black">{formatNgn(displayPriceNgn)}</span>
                {hasDiscount && displayOriginalPriceNgn && (
                  <span className="text-[8px] text-muted-text line-through hidden sm:inline">{formatNgn(displayOriginalPriceNgn)}</span>
                )}
              </div>

              <Button
                size="sm"
                className={`w-1/2 h-6 text-[9px] bg-black text-white hover:bg-black/90 focus:ring-black rounded-full ${isOwnProduct ? "hidden" : ""}`}
                onClick={handleAddToCart}
                disabled={isSoldOut}
              >
                {isSoldOut ? "Sold Out" : "Buy"}
              </Button>

              {isOwnProduct && (
                <div className="flex gap-1 w-1/2">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-6 text-[9px] px-0"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit();
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1 h-6 text-[9px] px-0"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      Del
                    </Button>
                  )}
                </div>
              )}
            </div>

            {hasDiscount && displayOriginalPriceNgn && (
              <div className="text-[6px] text-green-600 font-medium hidden sm:block">
                Save {formatNgn(displayOriginalPriceNgn - displayPriceNgn)}
              </div>
            )}
          </div>

          {isOwnProduct && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">Stock: {p.inventory ?? 0}</span>
                <span className="flex items-center gap-1">Views: {Math.floor(Math.random() * 100) + 12}</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-1.5 flex gap-1.5 items-start">
                <span className="text-[10px]">Tip</span>
                <p className="text-[7px] leading-tight text-blue-700 font-medium">
                  {p.price > 100
                    ? "Price is above market average. Consider a small discount."
                    : p.inventory && p.inventory < 5
                      ? "Low stock can improve urgency."
                      : "Pricing looks good. A featured listing can increase views."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
