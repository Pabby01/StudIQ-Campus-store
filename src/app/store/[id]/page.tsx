"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Store as StoreIcon, MapPin, Star, Package } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProductCard from "@/components/ProductCard";

type Store = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  banner_url?: string | null;
  rating?: number | null;
};

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  rating?: number | null;
  category?: string;
};

export default function StoreDetailPage() {
  const params = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch store details
        const storeRes = await fetch(`/api/store/${params?.id}`);
        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStore(storeData);
        }

        // Fetch store products
        const productsRes = await fetch(`/api/product/search?storeId=${params?.id}`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <div className="text-center">
          <StoreIcon className="w-12 h-12 text-muted-text mx-auto mb-3 animate-pulse" />
          <p className="text-muted-text">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Card className="text-center py-12 max-w-md">
          <StoreIcon className="w-16 h-16 text-muted-text mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-black mb-2">Store not found</h3>
          <p className="text-muted-text">This store may have been removed</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      {/* Store Banner */}
      <div className="relative h-64 bg-gradient-to-br from-primary-blue to-accent-blue">
        {store.banner_url ? (
          <img src={store.banner_url} alt={store.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <StoreIcon className="w-24 h-24 text-white opacity-50" />
          </div>
        )}
      </div>

      {/* Store Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-black">{store.name}</h1>
                <Badge variant="blue">{store.category}</Badge>
              </div>
              {store.description && (
                <p className="text-muted-text mb-4">{store.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-black">
                    {store.rating?.toFixed?.(1) ?? "4.5"}
                  </span>
                </div>
                <span className="text-muted-text">•</span>
                <div className="flex items-center gap-1 text-muted-text">
                  <Package className="w-4 h-4" />
                  <span>{products.length} products</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Products Section */}
        <div className="space-y-6 pb-12">
          <div>
            <h2 className="text-2xl font-bold text-black mb-2">Products</h2>
            <p className="text-muted-text">Browse all products from this store</p>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <Package className="w-16 h-16 text-muted-text mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No products yet</h3>
              <p className="text-muted-text">This store hasn't added any products</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
