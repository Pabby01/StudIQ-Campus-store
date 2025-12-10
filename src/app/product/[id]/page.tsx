"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, ShoppingCart, Minus, Plus, Loader2, Package } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/useToast";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string | null;
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
  const addToCart = useCart((s) => s.add);
  const toast = useToast();

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
      setProduct(data);
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

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-2xl overflow-hidden border border-border-gray">
            <div className="aspect-square bg-soft-gray-bg flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-24 h-24 text-muted-text" />
              )}
            </div>
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
                  {product.rating?.toFixed(1) || "4.5"}
                </span>
              </div>
              <span className="text-sm text-muted-text">(127 reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary-blue">
                ${product.price.toFixed(2)}
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
              <p className="text-muted-text leading-relaxed">
                {product.description || "No description available."}
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
      </div>
    </div>
  );
}
