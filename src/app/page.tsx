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

  // Categorize products for different sections
  const electronicsProducts = products.filter((p) => p.category === "Electronics");
  const booksProducts = products.filter((p) => p.category === "Books");
  const dealProducts = products.slice(0, 8);
  const newArrivals = products.slice(0, 6);

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      {/* Hero Carousel */}
      <div className="bg-white border-b border-border-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <HeroCarousel />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Promotional Banners Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PromoBanner
            title="Earn Rewards"
            subtitle="Get points on every purchase"
            ctaText="Learn more"
            ctaLink="/dashboard"
            bgColor="bg-gradient-to-br from-blue-600 to-blue-800"
          />
          <PromoBanner
            title="Campus Deals"
            subtitle="Up to 50% off"
            ctaText="Shop now"
            ctaLink="/search"
            bgColor="bg-gradient-to-br from-purple-600 to-purple-800"
          />
          <PromoBanner
            title="Fast Delivery"
            subtitle="Same-day on campus"
            ctaText="Browse stores"
            ctaLink="/stores"
            bgColor="bg-gradient-to-br from-green-600 to-green-800"
          />
        </div>

        {/* Flash Deals Section */}
        {!loading && dealProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-border-gray p-6 md:p-8">
            <ProductRow
              title="Flash Deals & More"
              subtitle="Limited time offers - up to 50% off"
              products={dealProducts}
              viewAllLink="/search"
              badgeText="DEAL"
              badgeColor="bg-red-600"
            />
          </div>
        )}

        {/* Electronics Deals */}
        {!loading && electronicsProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-border-gray p-6 md:p-8">
            <ProductRow
              title="Tech Essentials"
              subtitle="Laptops, headphones & more"
              products={electronicsProducts}
              viewAllLink="/search?category=Electronics"
              badgeText="HOT"
              badgeColor="bg-orange-600"
            />
          </div>
        )}

        {/* Books Section */}
        {!loading && booksProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-border-gray p-6 md:p-8">
            <ProductRow
              title="Textbooks & Supplies"
              subtitle="Everything you need for class"
              products={booksProducts}
              viewAllLink="/search?category=Books"
            />
          </div>
        )}

        {/* New Arrivals with Icons */}
        {!loading && newArrivals.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Sparkles className="w-6 h-6 text-primary-blue" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">New Arrivals</h2>
                <p className="text-sm text-muted-text">Fresh products from campus stores</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {newArrivals.map((p) => (
                <div key={p.id} className="relative">
                  <div className="absolute top-3 right-3 z-10 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                    NEW
                  </div>
                  <ProductCard key={p.id} p={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nearby Stores */}
        {!loading && nearbyStores.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Store className="w-6 h-6 text-primary-blue" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Stores Near You</h2>
                <p className="text-sm text-muted-text">Discover local campus shops</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {nearbyStores.slice(0, 6).map((s) => (
                <StoreCard key={s.id} s={s} />
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA Banner */}
        <div className="bg-gradient-to-r from-primary-blue to-accent-blue rounded-2xl p-8 md:p-12 text-center text-white">
          <Zap className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">Start Selling on Campus</h2>
          <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
            Join hundreds of students earning with their own campus store. Set up in minutes.
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard/store")}
            className="bg-white text-primary-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Create Your Store
          </button>
        </div>
      </div>
    </div>
  );
}
