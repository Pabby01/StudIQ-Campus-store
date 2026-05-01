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

const NGN_CACHE_MS = 30000;
  const formatNgn = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);

  const displayPrice = displayPriceNgn;

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
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
          <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-full bg-white/90 px-1 py-0.5 text-[8px] font-semibold text-black shadow-sm border border-black/10">
            <Star className="w-2 h-2 fill-black text-black" />
            {p.rating?.toFixed?.(1) ?? "0.0"}
          </div>
        </div>

        <div className="px-3 pb-3 flex flex-col min-h-0 h-full">
          <div className="flex items-center justify-between mb-0.5">
            {p.category && (
              <span className="hidden sm:inline text-[7px] text-muted-text uppercase tracking-wide truncate pr-1">
                {p.category}
              </span>
            )}
            {p.isPremiumSeller && <PremiumBadge size="sm" />}
          </div>

          <p className="font-semibold text-black text-[10px] line-clamp-1 mb-0.5 min-h-[11px] leading-tight group-hover:text-black">
            {p.name}
          </p>

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
              {hasDiscount && displayOriginalPriceNgn ? (
                <span className="text-[8px] text-muted-text line-through hidden sm:inline">
                  {formatNgn(displayOriginalPriceNgn)}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-1/2 flex items-baseline gap-1">
                <span className="text-[11px] font-bold text-black">
                  {formatNgn(displayPrice)}
                </span>
                {hasDiscount && displayOriginalPriceNgn && (
                  <span className="text-[8px] text-muted-text line-through hidden sm:inline">
                    {formatNgn(displayOriginalPriceNgn)}
                  </span>
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
                Save {formatNgn(displayOriginalPriceNgn - displayPrice)}
              </div>
            )}
          </div>

          {isOwnProduct && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">📦 Stock: {p.inventory ?? 0}</span>
                <span className="flex items-center gap-1">👁️ {Math.floor(Math.random() * 100) + 12} views</span>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-1.5 flex gap-1.5 items-start">
                <span className="text-[10px]">✨</span>
                <p className="text-[7px] leading-tight text-blue-700 font-medium">
                  {p.price > 100
                    ? "Price is 15% above market avg. Consider a discount."
                    : p.inventory && p.inventory < 5
                      ? "Low stock. Add urgency to boost conversions."
                      : "Good pricing. Try a featured listing for more views."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
            {p.isPremiumSeller && (
              <PremiumBadge size="sm" />
            )}
          </div>

          <p className="font-semibold text-black text-[10px] line-clamp-1 mb-0.5 min-h-[11px] leading-tight group-hover:text-black">
            {p.name}
          </p>
          {p.stores?.name && (
            <Link
              href={`/store/${p.store_id}`}
              className="text-[8px] text-primary-blue mb-0.5 hover:underline w-fit"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
            >
              {p.stores.name}
            </Link>
          )}

          {/* Pricing */}
          <div className="space-y-0.5 mt-auto">
            <div className="text-[6px] text-muted-text min-h-[10px]">
                      {formatNgn(displayPriceNgn)}
                ? `≈ ${fxOtherLabel} · ${fxNgnLabel}`
                : fxOtherLabel
                      <span className="text-[8px] text-muted-text line-through hidden sm:inline">
                        {formatNgn(displayOriginalPriceNgn!)}
                    ? `≈ ${fxNgnLabel}`
                    : ""}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1/2 flex items-baseline gap-1">
                <span className="text-[11px] font-bold text-black">
                  {formatPrice(Number(displayPrice))}
                </span>
                {hasDiscount && (
                  <span className="text-[8px] text-muted-text line-through hidden sm:inline">
                    {formatPrice(originalPrice!)}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                className={`w-1/2 h-6 text-[9px] bg-black text-white hover:bg-black/90 focus:ring-black rounded-full ${isOwnProduct ? 'hidden' : ''}`}
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
                  Save {formatNgn(displayOriginalPriceNgn! - displayPriceNgn)}
                      }}
                    >
                      Del
                    </Button>
                  )}
                </div>
              )}
            </div>
            {hasDiscount && (
              <div className="text-[6px] text-green-600 font-medium hidden sm:block">
                Save {formatPrice(originalPrice! - p.price)}
              </div>
            )}
          </div>

          {/* Seller Stats & AI Tips */}
          {isOwnProduct && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  📦 Stock: {p.inventory ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  👁️ {Math.floor(Math.random() * 100) + 12} views
                </span>
              </div>
              
              {/* AI Tip */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-1.5 flex gap-1.5 items-start">
                <span className="text-[10px]">✨</span>
                <p className="text-[7px] leading-tight text-blue-700 font-medium">
                  {p.price > 100 
                    ? "Price is 15% above market avg. Consider a discount." 
                    : p.inventory && p.inventory < 5 

      const value = extractTokenValue(data?.tokenValue);
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
