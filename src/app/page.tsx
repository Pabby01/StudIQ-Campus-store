"use client";

import { useEffect, useState } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import ProductRow from "@/components/ProductRow";
import PromoBanner from "@/components/PromoBanner";
import StoreCard from "@/components/StoreCard";
import ProductCard from "@/components/ProductCard";
import { encodeGeohash } from "@/lib/geohash";
import { Store, TrendingUp, Sparkles, Zap } from "lucide-react";

type Product = Readonly<{
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  rating?: number | null;
  category?: string;
}>;
type StoreType = Readonly<{
  id: string;
  name: string;
  category: string;
  banner_url?: string | null;
  description?: string | null;
}>;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [nearbyStores, setNearbyStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsRes = await fetch("/api/product/search?limit=20");
        const productsData = await productsRes.json();
        if (productsData.ok && productsData.products) {
          setProducts(productsData.products);
        }

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
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Carousel */}
        <HeroCarousel />

        {/* Promo Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PromoBanner
            title="Earn Rewards"
            subtitle="Get points on every purchase"
            bgColor="bg-gradient-to-r from-blue-600 to-purple-600"
            ctaText="Learn More"
            ctaLink="/dashboard"
          />
          <PromoBanner
            title="Campus Deals"
            subtitle="Exclusive student discounts"
            bgColor="bg-gradient-to-r from-purple-600 to-pink-600"
            ctaText="Shop Deals"
            ctaLink="/search"
          />
          <PromoBanner
            title="Fast Delivery"
            subtitle="Same-day campus delivery"
            bgColor="bg-gradient-to-r from-green-600 to-teal-600"
            ctaText="Order Now"
            ctaLink="/search"
          />
        </div>

        {/* Flash Deals */}
        <ProductRow
          title="⚡ Flash Deals"
          subtitle="Limited time offers"
          products={products.slice(0, 8).map((p) => ({ ...p, badge: "SALE" }))}
        />

        {/* Tech Essentials */}
        <ProductRow
          title="💻 Tech Essentials"
          subtitle="Electronics & Gadgets"
          products={products.filter((p) => p.category === "Electronics").slice(0, 8)}
        />

        {/* Textbooks */}
        <ProductRow
          title="📚 Textbooks & Study Materials"
          subtitle="Academic resources"
          products={products.filter((p) => p.category === "Books & Textbooks").slice(0, 8)}
        />

        {/* New Arrivals */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black">🆕 New Arrivals</h2>
              <p className="text-sm text-muted-text">Fresh products from campus stores</p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} p={product} />
            ))}
          </div>
        </section>

        {/* Nearby Stores */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-blue/10 rounded-lg">
              <Store className="w-6 h-6 text-primary-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">Nearby Stores</h2>
              <p className="text-sm text-muted-text">Shop from stores on your campus</p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyStores.slice(0, 6).map((store) => (
              <StoreCard key={store.id} s={store} />
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-primary-blue to-accent-blue rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Start Selling on Campus</h2>
          <p className="text-lg opacity-90 mb-6">
            Join hundreds of student entrepreneurs earning with StudIQ
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard/store")}
            className="px-8 py-3 bg-white text-primary-blue font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Create Your Store
          </button>
        </div>
      </div>
    </div>
  );
}
