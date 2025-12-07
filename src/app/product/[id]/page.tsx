"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, ShoppingCart, Package } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useCart } from "@/store/cart";

type Product = {
  id: string;
  name: string;
  price: number;
  category?: string;
  image_url?: string | null;
  rating?: number | null;
  inventory?: number;
  description?: string;
};

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCart((s) => s.add);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/product/${params?.id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params?.id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart({ id: product.id, name: product.name, price: product.price }, quantity);
      alert("Added to cart!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-muted-text mx-auto mb-3 animate-pulse" />
          <p className="text-muted-text">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Card className="text-center py-12 max-w-md">
          <Package className="w-16 h-16 text-muted-text mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-black mb-2">Product not found</h3>
          <p className="text-muted-text">This product may have been removed</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-xl border border-border-gray p-8">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-lg"
              />
            ) : (
              <div className="w-full aspect-square bg-soft-gray-bg rounded-lg flex items-center justify-center">
                <Package className="w-24 h-24 text-muted-text" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              {product.category && <Badge variant="blue">{product.category}</Badge>}
              <h1 className="text-4xl font-bold text-black mt-3 mb-2">{product.name}</h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-black">
                    {product.rating?.toFixed?.(1) ?? "0.0"}
                  </span>
                </div>
                <span className="text-muted-text">•</span>
                <span className="text-sm text-muted-text">
                  {product.inventory ?? 0} in stock
                </span>
              </div>
            </div>

            <div className="border-t border-b border-border-gray py-6">
              <div className="text-4xl font-bold text-primary-blue">
                ${Number(product.price).toFixed(2)}
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">Description</h3>
                <p className="text-muted-text leading-relaxed">{product.description}</p>
              </div>
            )}

            <Card>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center bg-soft-gray-bg hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-soft-gray-bg hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <Button variant="primary" className="w-full" size="lg" onClick={handleAddToCart}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
