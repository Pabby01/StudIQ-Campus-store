/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Minus, Plus, Loader2, Package, ChevronLeft, ChevronRight, Edit, Trash2, Share2, Heart } from "lucide-react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/useToast";
import ProductReviews from "@/components/ProductReviews";
import { useCivicWallet } from "@/hooks/useCivicWallet";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: "USDC" | "USDT" | "SOL" | "USD";
  price_ngn?: number | null;
  priceNgn?: number | null;
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
  const [isWishlisted, setIsWishlisted] = useState(false);

  const addToCart = useCart((s) => s.add);
  const toast = useToast();
  const { walletAddress } = useCivicWallet();

  useEffect(() => {
    fetchProduct();
  }, [productId]);

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

  const formatNgn = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name || "StudIQ Product",
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not share link");
    }
  };

  const toggleWishlist = async () => {
    if (!walletAddress || !product) {
      toast.error("Please connect your wallet first");
      return;
    }

    const previousState = isWishlisted;
    setIsWishlisted(!previousState);

    try {
      if (!previousState) {
        await fetch("/api/wishlist", {
          method: "POST",
          body: JSON.stringify({ address: walletAddress, productId: product.id }),
        });
        toast.success("Added to wishlist");
      } else {
        await fetch(`/api/wishlist?address=${walletAddress}&productId=${product.id}`, {
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

  const handleAddToCart = () => {
    if (!product) return;

    const displayPrice = product.price_ngn ?? product.priceNgn ?? product.price;

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: displayPrice,
        priceNgn: displayPrice,
        storeId: product.store_id,
        imageUrl: product.image_url || undefined,
        isPodEnabled: product.is_pod_enabled,
        currency: (product.currency as "USDC" | "USDT" | undefined) || "USDC",
      },
      quantity
    );

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
    } catch {
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
  const displayPrice = product.price_ngn ?? product.priceNgn ?? product.price;

  const galleryImages = [
    ...(product.images || []),
    ...(product.image_url && !product.images?.includes(product.image_url) ? [product.image_url] : []),
  ].filter(Boolean) as string[];

  const uniqueImages = Array.from(new Set(galleryImages));

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? uniqueImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === uniqueImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/80 border border-white/60 flex items-center justify-center shadow-sm active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-white/80 border border-white/60 flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4 text-black" />
            </button>
            <button
              onClick={toggleWishlist}
              className="w-9 h-9 rounded-full bg-white/80 border border-white/60 flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-black"}`} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-white/60 bg-white shadow-sm group">
              <div className="aspect-square bg-white flex items-center justify-center p-4 relative">
                {uniqueImages.length > 0 ? (
                  <motion.img
                    key={selectedImageIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
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
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 z-10"
                  >
                    <ChevronLeft className="w-5 h-5 text-black" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 z-10"
                  >
                    <ChevronRight className="w-5 h-5 text-black" />
                  </button>
                </>
              )}
            </div>

            {uniqueImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {uniqueImages.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 ${selectedImageIndex === index ? "border-primary-blue" : "border-white/60"}`}
                  >
                    <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {product.category && <Badge variant="gray">{product.category}</Badge>}
                {product.is_pod_enabled && <Badge variant="green">POD Enabled</Badge>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">{product.name}</h1>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-black">{formatNgn(displayPrice)}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-base text-muted-text line-through">
                      {formatNgn(product.price_ngn && product.price ? (displayPrice / product.price) * product.original_price : product.original_price)}
                    </span>
                  )}
                </div>
                <Button variant="primary" size="lg" className="px-6" onClick={handleAddToCart} disabled={!inStock}>
                  {inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
              </div>
            </div>

            <div>{inStock ? <p className="text-green-600 font-medium">In Stock ({product.inventory} available)</p> : <p className="text-red-600 font-medium">Out of Stock</p>}</div>

            <div>
              <h3 className="font-semibold text-black mb-2">Description</h3>
              <p className="text-muted-text leading-relaxed whitespace-pre-line">{product.description || "No description provided by seller."}</p>
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
                  <Button variant="primary" size="lg" className="flex-1" onClick={() => router.push(`/dashboard/products/edit/${product.id}`)}>
                    <Edit className="w-5 h-5 mr-2" />
                    Edit Product
                  </Button>
                  <Button variant="danger" size="lg" className="flex-shrink-0" onClick={handleDelete}>
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              inStock && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 glass-pill rounded-full flex items-center justify-center hover:bg-white/80 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold text-black">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.inventory || 1, quantity + 1))}
                      className="w-10 h-10 glass-pill rounded-full flex items-center justify-center hover:bg-white/80 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="border-t border-white/50 mt-12 pt-8">
          <ProductReviews productId={product.id} onReviewAdded={fetchProduct} />
        </div>
      </div>
    </div>
  );
}
