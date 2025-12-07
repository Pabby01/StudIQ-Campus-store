"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import StoreCard from "@/components/StoreCard";
import HeroSection from "@/components/HeroSection";
import { encodeGeohash } from "@/lib/geohash";
import { Package, Store } from "lucide-react";

type Product = Readonly<{ id: string; name: string; price: number; image_url?: string | null; rating?: number | null; category?: string }>;
type StoreType = Readonly<{ id: string; name: string; category: string; banner_url?: string | null; description?: string | null }>;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [nearbyStores, setNearbyStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsRes = await fetch("/api/product/search");
        const productsData = await productsRes.json();
        setProducts(productsData);

        // Fetch nearby stores
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const gh = encodeGeohash(pos.coords.latitude, pos.coords.longitude, 6);
              const storesRes = await fetch(`/api/store/nearby?geoprefix=${gh.substring(0, 5)}`);
              const storesData = await storesRes.json();
              setNearbyStores(storesData);
            },
            async () => {
              const storesRes = await fetch(`/api/store/nearby?geoprefix=`);
              const storesData = await storesRes.json();
              setNearbyStores(storesData);
            }
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Featured Products */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-6 h-6 text-primary-blue" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Featured Products</h2>
                <p className="text-sm text-muted-text">Discover the best deals on campus</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border-gray p-4 animate-pulse">
                  <div className="aspect-square bg-soft-gray-bg rounded-lg mb-4"></div>
                  <div className="h-4 bg-soft-gray-bg rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-soft-gray-bg rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.slice(0, 8).map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-border-gray">
              <Package className="w-12 h-12 text-muted-text mx-auto mb-3" />
              <p className="text-muted-text">No products available yet</p>
            </div>
          )}
        </section>

        {/* Nearby Stores */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Store className="w-6 h-6 text-primary-blue" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Nearby Stores</h2>
                <p className="text-sm text-muted-text">Explore stores in your area</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border-gray overflow-hidden animate-pulse">
                  <div className="h-40 bg-soft-gray-bg"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-soft-gray-bg rounded w-3/4"></div>
                    <div className="h-4 bg-soft-gray-bg rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : nearbyStores.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {nearbyStores.slice(0, 6).map((s) => (
                <StoreCard key={s.id} s={s} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-border-gray">
              <Store className="w-12 h-12 text-muted-text mx-auto mb-3" />
              <p className="text-muted-text">No stores found nearby</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
