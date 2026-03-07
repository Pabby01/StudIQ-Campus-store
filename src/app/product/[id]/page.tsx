/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, ShoppingCart, Minus, Plus, Loader2, Package, ChevronLeft, ChevronRight, Edit, Trash2, Share2, Heart } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/useToast";
import ProductReviews from "@/components/ProductReviews";
import { useCivicWallet } from "@/hooks/useCivicWallet";

const NGN_CACHE_MS = 30000;
let cachedNgnPerUsd: number | null = null;
let cachedNgnAt = 0;
let ngnInFlight: Promise<number | null> | null = null;
let cachedSolUsd: number | null = null;
let cachedSolAt = 0;
let solInFlight: Promise<number | null> | null = null;

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: "SOL" | "USDC";
  price_ngn?: number | null;
  image_url?: string | null;
  images?: string[];
  is_pod_enabled?: boolean;
  rating?: number | null;
  category?: string;
  inventory?: number;
  store_id: string;
  stores?: {
    name: string;
    owner_address: string;
  };
  original_price?: number;
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [ngnPerUsd, setNgnPerUsd] = useState<number | null>(cachedNgnPerUsd);
  const [solUsd, setSolUsd] = useState<number | null>(cachedSolUsd);

  const addToCart = useCart((s) => s.add);
  const toast = useToast();
  const { walletAddress } = useCivicWallet();

  useEffect(() => {
    fetchProduct();
  }, [productId]);

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

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/product/${productId}`);
      if (res.status === 404) {
        setProduct(null);
        return;
      }
      const data = await res.json();
      setProduct(data.product);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      priceNgn: product.price_ngn ?? undefined,
      storeId: product.store_id,
      imageUrl: product.image_url || undefined,
      isPodEnabled: product.is_pod_enabled,
      currency: product.currency || "SOL",
    }, quantity);

    toast.success("Added to cart", `${quantity}x ${product.name}`);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/product/${productId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted");
        router.push("/dashboard/products");
      } else {
        toast.error("Failed to delete product");
      }
    } catch (e) {
      toast.error("Error deleting product");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg mesh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-soft-gray-bg mesh-bg flex items-center justify-center">
        <div className="text-center glass-panel rounded-3xl p-8">
          <Package className="w-16 h-16 text-muted-text mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">Product not found</h2>
          <p className="text-muted-text mb-6">This product may have been removed</p>
          <Button variant="primary" onClick={() => (window.location.href = "/search")}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  const inStock = (product.inventory || 0) > 0;
  const isOwner = walletAddress && product.stores?.owner_address === walletAddress;
  const displayPrice = getDisplayPrice(product, solUsd, ngnPerUsd);
  const ngnEquivalent = getNgnEquivalent(product, solUsd, ngnPerUsd);

  // Combine image_url and images array for the gallery
  const galleryImages = [
    ...(product.images || []),
    ...(product.image_url && !product.images?.includes(product.image_url) ? [product.image_url] : [])
  ].filter(Boolean);

  // Deduplicate
  const uniqueImages = Array.from(new Set(galleryImages));

  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/80 border border-white/60 flex items-center justify-center shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-white/80 border border-white/60 flex items-center justify-center shadow-sm">
              <Share2 className="w-4 h-4 text-black" />
            </button>
            <button className="w-9 h-9 rounded-full bg-white/80 border border-white/60 flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Product Images Gallery */}
          <div className="space-y-4">
            <div className="rounded-3xl overflow-hidden border border-white/60 bg-white/80 shadow-sm relative group">
              <div className="aspect-square bg-white/60 flex items-center justify-center p-4">
                {uniqueImages.length > 0 ? (
                  <img
                    src={uniqueImages[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Package className="w-24 h-24 text-muted-text" />
                )}
              </div>

              {uniqueImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? uniqueImages.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5 text-black" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev === uniqueImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5 text-black" />
                  </button>
                </>
              )}
            </div>

            {uniqueImages.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                {uniqueImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${selectedImageIndex === idx ? "bg-primary-blue" : "bg-slate-300"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6 bg-white/80 border border-white/60 rounded-3xl p-6 shadow-sm">
            {product.category && (
              <Badge variant="blue">{product.category}</Badge>
            )}

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">{product.name}</h1>
              {product.stores?.name && (
                <p className="text-sm text-primary-blue mt-1">{product.stores.name}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-black">
                  {product.rating?.toFixed(1) || "New"}
                </span>
              </div>
              <span className="text-sm text-muted-text">
                {product.rating ? "(12 reviews)" : "(No reviews yet)"}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-black">
                    {product.currency === "USDC" ? "USDC" : "SOL"} {displayPrice.toFixed(2)}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-base text-muted-text line-through">
                      {product.currency === "USDC" ? "USDC" : "SOL"} {product.original_price.toFixed(2)}
                    </span>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="px-6"
                  onClick={handleAddToCart}
                  disabled={!inStock}
                >
                  {inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
              </div>
              {ngnEquivalent && (
                <p className="text-sm text-muted-text">≈ ₦{ngnEquivalent.toFixed(2)}</p>
              )}
              {product.is_pod_enabled && (
                <div className="w-fit px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
                  Cash on Delivery Available
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {inStock ? (
                <p className="text-green-600 font-medium">
                  In Stock ({product.inventory} available)
                </p>
              ) : (
                <p className="text-red-600 font-medium">Out of Stock</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-black mb-2">Description</h3>
              <p className="text-muted-text leading-relaxed whitespace-pre-line">
                {product.description || "No description provided by seller."}
              </p>
            </div>

            {product.stores && (
              <div className="p-4 glass-pill rounded-2xl">
                <p className="text-sm text-muted-text mb-1">Sold by</p>
                <p className="font-semibold text-black">{product.stores.name}</p>
              </div>
            )}

            {isOwner ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 text-blue-800 rounded-2xl border border-blue-100">
                  <p className="font-medium flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    You are the owner of this product
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/products/edit/${product.id}`)}
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    Edit Product
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    className="flex-shrink-0"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {inStock && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 glass-pill rounded-full flex items-center justify-center hover:bg-white/80 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-semibold text-black">
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          setQuantity(Math.min(product.inventory || 1, quantity + 1))
                        }
                        className="w-10 h-10 glass-pill rounded-full flex items-center justify-center hover:bg-white/80 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-white/50 mt-12 pt-8">
          <ProductReviews productId={product.id} onReviewAdded={fetchProduct} />
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

function getDisplayPrice(product: { price: number; price_ngn?: number | null; currency?: "SOL" | "USDC" }, solUsd: number | null, ngnPerUsd: number | null) {
  if (product.price_ngn && ngnPerUsd) {
    if (product.currency === "USDC") return product.price_ngn / ngnPerUsd;
    if (product.currency === "SOL" && solUsd) return product.price_ngn / (solUsd * ngnPerUsd);
  }
  return product.price;
}

function getNgnEquivalent(product: { price: number; price_ngn?: number | null; currency?: "SOL" | "USDC" }, solUsd: number | null, ngnPerUsd: number | null) {
  if (product.price_ngn) return product.price_ngn;
  if (!ngnPerUsd || !product.currency) return null;
  if (product.currency === "USDC") return product.price * ngnPerUsd;
  if (product.currency === "SOL" && solUsd) return product.price * solUsd * ngnPerUsd;
  return null;
}
