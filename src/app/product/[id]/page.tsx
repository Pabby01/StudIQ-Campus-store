"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, ShoppingCart, Minus, Plus, Loader2, Package, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/useToast";
import ProductReviews from "@/components/ProductReviews";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: "SOL" | "USDC";
  image_url?: string | null;
  images?: string[];
  rating?: number | null;
  category?: string;
  inventory?: number;
  store_id: string;
  stores?: {
    name: string;
    owner_address: string;
  };
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const addToCart = useCart((s) => s.add);
  const { toast } = useToast();

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

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      storeId: product.store_id,
      imageUrl: product.image_url || undefined,
    }, quantity);

    toast.success("Added to cart", `${quantity}x ${product.name}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <div className="text-center">
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

  // Combine image_url and images array for the gallery
  const galleryImages = [
    ...(product.images || []),
    ...(product.image_url && !product.images?.includes(product.image_url) ? [product.image_url] : [])
  ].filter(Boolean);

  // Deduplicate
  const uniqueImages = Array.from(new Set(galleryImages));

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Images Gallery */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden border border-border-gray relative group">
              <div className="aspect-square bg-white flex items-center justify-center">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5 text-black" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev === uniqueImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5 text-black" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {uniqueImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {uniqueImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-primary-blue opacity-100 ring-2 ring-primary-blue/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            {product.category && (
              <Badge variant="blue">{product.category}</Badge>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-black">{product.name}</h1>

            {/* Rating */}
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

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary-blue">
                {product.currency === "USDC" ? "USDC" : "$"} {product.price.toFixed(2)}
              </span>
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

            {/* Description */}
            <div>
              <h3 className="font-semibold text-black mb-2">Description</h3>
              <p className="text-muted-text leading-relaxed whitespace-pre-line">
                {product.description || "No description provided by seller."}
              </p>
            </div>

            {/* Store Info */}
            {product.stores && (
              <div className="p-4 bg-soft-gray-bg rounded-lg">
                <p className="text-sm text-muted-text mb-1">Sold by</p>
                <p className="font-semibold text-black">{product.stores.name}</p>
              </div>
            )}

            {/* Quantity Selector */}
            {inStock && (
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-soft-gray-bg rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
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
                    className="w-10 h-10 bg-soft-gray-bg rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-border-gray mt-12 pt-8">
          <ProductReviews productId={product.id} />
        </div>
      </div>
    </div>
  );
}
