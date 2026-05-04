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
  category?: string;
  badge?: string;
  badgeTone?: string;
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

  const getCategoryTone = (category?: string) => {
    const value = (category || "").toLowerCase();
    if (value.includes("book")) return "from-amber-500 via-orange-400 to-yellow-400";
    if (value.includes("elect")) return "from-cyan-500 via-sky-500 to-blue-500";
    if (value.includes("fashion") || value.includes("cloth")) return "from-fuchsia-500 via-pink-500 to-rose-500";
    if (value.includes("food")) return "from-emerald-500 via-teal-500 to-lime-400";
    if (value.includes("beaut")) return "from-purple-500 via-violet-500 to-indigo-500";
    return "from-slate-500 via-slate-400 to-zinc-500";
  };

  const getBadgeTone = (badge?: string) => {
    const value = (badge || "").toLowerCase();
    if (value.includes("featured")) return "from-emerald-500 via-teal-500 to-cyan-500";
    if (value.includes("sponsored")) return "from-fuchsia-500 via-pink-500 to-rose-500";
    if (value.includes("hot") || value.includes("sale")) return "from-orange-500 via-amber-500 to-yellow-500";
    if (value.includes("new")) return "from-sky-500 via-blue-500 to-indigo-500";
    return p.badgeTone || "from-slate-700 via-slate-600 to-slate-500";
  };

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
        className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[18px] border border-gray-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
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
        <div className="relative aspect-[1/1] w-full overflow-hidden bg-slate-50">
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

          {p.category && (
            <div className={`absolute left-2 top-2 rounded-full bg-gradient-to-r ${getCategoryTone(p.category)} px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white shadow-md`}>
              {p.category}
            </div>
          )}

          {p.badge && (
            <div className={`absolute right-2 top-2 rounded-full bg-gradient-to-r ${getBadgeTone(p.badge)} px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white shadow-md`}>
              {p.badge}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-2.5 sm:p-3">
          <h3 className="text-[13px] font-semibold leading-tight text-slate-950 line-clamp-2 sm:text-sm lg:text-[15px]">
            {p.name}
          </h3>

          <div className="mt-auto flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-slate-500">Price</div>
              <div className="text-sm font-bold text-slate-950 sm:text-base">
                {formatNgn(displayPriceNgn)}
              </div>
            </div>

            {!isOwnProduct ? (
              <Button
                size="sm"
                className="h-8 shrink-0 rounded-full bg-slate-950 px-3 text-[11px] font-semibold text-white hover:bg-slate-800 sm:px-4 sm:text-xs"
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
                    className="h-8 rounded-full px-3 text-[11px] sm:px-4 sm:text-xs"
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
                    className="h-8 rounded-full px-3 text-[11px] sm:px-4 sm:text-xs"
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
