/* eslint-disable react-hooks.purity */
"use client";

import Image from "next/image";
import Button from "@/components/ui/Button";
import { useCart } from "@/store/cart";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";

type Product = Readonly<{
  id: string;
  name: string;
  price: number;
  currency?: "USDC" | "USDT" | "SOL" | "USD";
  price_ngn?: number | null;
  priceNgn?: number | null;
  image_url?: string | null;
  store_id?: string;
  inventory?: number;
  owner_address?: string;
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

  const displayPriceNgn = p.price_ngn ?? p.priceNgn ?? p.price;
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

  return (
    <div className="h-full">
      <div
        className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[22px] border border-gray-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        onClick={openDetails}
        role="link"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDetails();
          }
        }}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
          {p.image_url ? (
            <Image
              src={p.image_url}
              alt={p.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Image</div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Product</p>
            <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-950 line-clamp-2 sm:text-[15px] lg:text-base">
              {p.name}
            </h3>
          </div>

          <div className="mt-auto flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-500">Price</div>
              <div className="text-base font-bold text-slate-950 sm:text-lg">
                {formatNgn(displayPriceNgn)}
              </div>
            </div>

            {!isOwnProduct ? (
              <Button
                size="sm"
                className="h-9 shrink-0 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={handleAddToCart}
                disabled={isSoldOut}
              >
                {isSoldOut ? "Sold Out" : "Buy"}
              </Button>
            ) : (
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full px-4 text-sm"
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
                    className="h-9 rounded-full px-4 text-sm"
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
        </div>
      </div>
    </div>
  );
}
