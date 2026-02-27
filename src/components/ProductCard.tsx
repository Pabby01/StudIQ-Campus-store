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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const NGN_CACHE_MS = 30000;
let cachedNgnPerUsd: number | null = null;
let cachedNgnAt = 0;
let ngnInFlight: Promise<number | null> | null = null;
let cachedSolUsd: number | null = null;
let cachedSolAt = 0;
let solInFlight: Promise<number | null> | null = null;

type Product = Readonly<{
  id: string;
  name: string;
  price: number;
  currency?: "SOL" | "USDC";
  price_ngn?: number | null;
  priceNgn?: number | null;
  image_url?: string | null;
  rating?: number | null;
  category?: string;
  originalPrice?: number;
  original_price?: number; // Support snake_case from DB
  store_id?: string;
  inventory?: number; // Stock count
  owner_address?: string; // Seller's address
  isPremiumSeller?: boolean; // Whether seller has premium subscription
  reviews_count?: number; // Total reviews
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
  const [ngnPerUsd, setNgnPerUsd] = useState<number | null>(cachedNgnPerUsd);
  const [solUsd, setSolUsd] = useState<number | null>(cachedSolUsd);

  const originalPrice = p.original_price || p.originalPrice;
  const hasDiscount = originalPrice && originalPrice > p.price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice! - p.price) / originalPrice!) * 100)
    : 0;

  const { walletAddress: address } = useCivicWallet();

  // Check if product is sold out
  const isSoldOut = p.inventory !== undefined && p.inventory <= 0;

  // Check if current user is the seller
  const isOwnProduct = address && p.owner_address && address === p.owner_address;

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
      price: displayPrice,
      storeId: p.store_id || "",
      imageUrl: p.image_url || undefined,
      currency: p.currency || "SOL",
      priceNgn: baseNgn || undefined,
    });

    toast.success("Added to cart", p.name);
  };

  const [isWishlisted, setIsWishlisted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadRates = async () => {
      const [ngnRate, solRate] = await Promise.all([getNgnPerUsd(), getSolUsd()]);
      if (ngnRate) setNgnPerUsd(ngnRate);
      if (solRate) setSolUsd(solRate);
    };
    loadRates();
    const interval = setInterval(loadRates, NGN_CACHE_MS);
    return () => clearInterval(interval);
  }, []);

  const openDetails = () => {
    router.push(`/product/${p.id}`);
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
      console.error("[Wishlist] Failed to update wishlist:", error);
    }
  };

  const formatPrice = (price: number) => {
    return p.currency === "SOL"
      ? `SOL ${price.toFixed(2)}`
      : `$${price.toFixed(2)}`;
  };
  const formatNgn = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
  const baseNgn = p.price_ngn ?? p.priceNgn ?? null;
  const livePrice =
    baseNgn && ngnPerUsd
      ? p.currency === "USDC"
        ? baseNgn / ngnPerUsd
        : p.currency === "SOL" && solUsd
          ? baseNgn / (solUsd * ngnPerUsd)
          : null
      : null;
  const displayPrice = livePrice ?? p.price;
  const ngnEquivalent = baseNgn ?? (p.currency === "USDC"
    ? ngnPerUsd
      ? displayPrice * ngnPerUsd
      : null
    : p.currency === "SOL" && solUsd && ngnPerUsd
      ? displayPrice * solUsd * ngnPerUsd
      : null);
  const otherCurrency =
    p.currency === "SOL" && solUsd
      ? `$${(displayPrice * solUsd).toFixed(2)}`
      : p.currency === "USDC" && solUsd
        ? `SOL ${(displayPrice / solUsd).toFixed(4)}`
        : null;

  return (
    <div className="h-full">
      <div
        className="glass-card rounded-2xl border border-white/60 overflow-hidden hover-lift h-full flex flex-col group relative cursor-pointer"
        onClick={openDetails}
      >

        {/* Wishlist Button - Hidden for own products */}
        {!isOwnProduct && (
          <button
            onClick={toggleWishlist}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full glass-pill flex items-center justify-center hover:bg-white/90 transition-all shadow-sm"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
          </button>
        )}

        {/* Sold Out Badge */}
        {isSoldOut && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full z-10 shadow-lg">
            SOLD OUT
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && !isSoldOut && (
          <Badge variant="green" className="absolute top-3 left-3 font-bold shadow-md rounded-full">
            {discountPercent}% OFF
          </Badge>
        )}

        {/* Image */}
        <div className="relative w-full pt-[60%] bg-gradient-to-br from-slate-50 to-white overflow-hidden">
          {p.image_url ? (
            <Image
              src={p.image_url}
              alt={p.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Premium Badge + Category */}
          <div className="flex items-center justify-between mb-1">
            {p.category && (
              <span className="text-[9px] text-muted-text uppercase tracking-wide truncate pr-1">
                {p.category}
              </span>
            )}
            {p.isPremiumSeller && (
              <PremiumBadge size="sm" />
            )}
          </div>

          {p.stores?.name && (
            <Link
              href={`/store/${p.store_id}`}
              className="text-[9px] text-primary-blue mb-1 hover:underline block w-fit"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
            >
              For {p.stores.name}
            </Link>
          )}
          <p className="font-semibold text-black text-xs sm:text-sm line-clamp-2 mb-1 min-h-[14px] leading-tight group-hover:text-primary-blue transition-colors">
            {p.name}
          </p>
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />
            <span className="text-[9px] font-medium text-black">
              {p.rating?.toFixed?.(1) ?? "0.0"}
            </span>
            <span className="text-[8px] text-muted-text">({p.reviews_count || 0})</span>
          </div>

          {/* Pricing */}
          <div className="space-y-1 mt-auto">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[12px] sm:text-sm font-bold text-black">
                {formatPrice(Number(displayPrice))}
              </span>
              {hasDiscount && (
                <span className="text-[9px] sm:text-[10px] text-muted-text line-through">
                  {formatPrice(originalPrice!)}
                </span>
              )}
            </div>
            {(ngnEquivalent || otherCurrency) && (
              <div className="flex flex-wrap items-center gap-1 text-[8px]">
                <span className="px-1 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  FX
                </span>
                {otherCurrency && (
                  <span className="px-1 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    ≈ {otherCurrency}
                  </span>
                )}
                {ngnEquivalent && (
                  <span className="px-1 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ≈ {formatNgn(ngnEquivalent)}
                  </span>
                )}
              </div>
            )}

            {hasDiscount && (
              <div className="text-[8px] text-green-600 font-medium">
                Save {formatPrice(originalPrice! - p.price)}
              </div>
            )}
          </div>

          {/* Stock Count - Show for sellers */}
          {isOwnProduct && p.inventory !== undefined && (
            <div className="mt-1 text-[8px] text-muted-text">
              Stock: {p.inventory}
            </div>
          )}

          {/* Add to Cart Button or Sold Out / Own Product Message */}
          <div className="mt-2">
            {isSoldOut ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs cursor-not-allowed opacity-60"
                disabled
              >
                Sold Out
              </Button>
            ) : isOwnProduct ? (
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
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
                    className="flex-1 h-8 text-xs"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={handleAddToCart}
              >
                Add to cart
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function extractTokenValue(tokenValue: unknown): number | null {
  if (typeof tokenValue === "number") return tokenValue;
  if (!tokenValue || typeof tokenValue !== "object") return null;
  const value = tokenValue as Record<string, unknown>;
  const direct =
    (typeof value.amount === "number" && value.amount) ||
    (typeof value.value === "number" && value.value) ||
    (typeof value.ngn === "number" && value.ngn) ||
    (typeof value.rate === "number" && value.rate);
  return typeof direct === "number" ? direct : null;
}

async function getNgnPerUsd() {
  const now = Date.now();
  if (cachedNgnPerUsd && now - cachedNgnAt < NGN_CACHE_MS) return cachedNgnPerUsd;
  if (ngnInFlight) return ngnInFlight;
  const usdcMint = process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
  ngnInFlight = fetch(`/api/ramp/rates?amount=1&mint=${encodeURIComponent(usdcMint)}`)
    .then((res) => res.json())
    .then((data) => {
      const value = extractTokenValue(data?.tokenValue);
      if (value) {
        cachedNgnPerUsd = value;
        cachedNgnAt = Date.now();
      }
      return value;
    })
    .finally(() => {
      ngnInFlight = null;
    });
  return ngnInFlight;
}

async function getSolUsd() {
  const now = Date.now();
  if (cachedSolUsd && now - cachedSolAt < NGN_CACHE_MS) return cachedSolUsd;
  if (solInFlight) return solInFlight;
  solInFlight = fetch("/api/price/sol")
    .then((res) => res.json())
    .then((data) => {
      const value = Number(data?.price);
      if (value && !Number.isNaN(value)) {
        cachedSolUsd = value;
        cachedSolAt = Date.now();
        return value;
      }
      return null;
    })
    .finally(() => {
      solInFlight = null;
    });
  return solInFlight;
}
