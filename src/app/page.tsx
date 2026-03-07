/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import ProductRow from "@/components/ProductRow";
import FeaturedStores from "@/components/FeaturedStores";
import StoreCard from "@/components/StoreCard";
import ProductCard from "@/components/ProductCard";
import { encodeGeohash } from "@/lib/geohash";
import { Store, TrendingUp, Sparkles, Zap, Laptop, BookOpen, Search, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

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
  const featureCards = [
    {
      title: "Instant Campus Delivery",
      description: "Get essentials delivered in hours with real‑time tracking.",
      image: "/tech.jpg",
      iconImage: "/tech.jpg",
      badge: "Fast",
      slug: "delivery",
      accent: "from-blue-100/80 via-white to-indigo-100/80",
    },
    {
      title: "Verified Student Stores",
      description: "Shop trusted campus sellers with reviews and ratings.",
      image: "/happy.jpg",
      iconImage: "/happy.jpg",
      badge: "Trusted",
      slug: "verified",
      accent: "from-emerald-100/80 via-white to-teal-100/80",
    },
    {
      title: "Secure Wallet Payments",
      description: "Pay with Solana in seconds or choose pay‑on‑delivery.",
      image: "/carousel_bg_2.png",
      iconImage: "/carousel_bg_2.png",
      badge: "Secure",
      slug: "payments",
      accent: "from-purple-100/80 via-white to-pink-100/80",
    },
    {
      title: "Rewards & Cashback",
      description: "Earn points on every order and unlock campus perks.",
      image: "/beat.jpg",
      iconImage: "/beat.jpg",
      badge: "Rewards",
      slug: "rewards",
      accent: "from-amber-100/80 via-white to-orange-100/80",
    },
  ];

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
              if (storesRes.ok) {
                const storesData = await storesRes.json();
                if (Array.isArray(storesData)) {
                  setNearbyStores(storesData);
                } else {
                  console.error("Unexpected nearby stores response (not an array):", storesData);
                  setNearbyStores([]);
                }
              } else {
                console.error("Failed to fetch nearby stores:", storesRes.status);
                setNearbyStores([]);
              }
            },
            async () => {
              const storesRes = await fetch(`/api/store/nearby?geoprefix=`);
              if (storesRes.ok) {
                const storesData = await storesRes.json();
                if (Array.isArray(storesData)) {
                  setNearbyStores(storesData);
                } else {
                  console.error("Unexpected nearby stores response (not an array):", storesData);
                  setNearbyStores([]);
                }
              } else {
                console.error("Failed to fetch fallback nearby stores:", storesRes.status);
                setNearbyStores([]);
              }
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
    <div className="min-h-screen bg-soft-gray-bg mesh-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 sm:pt-6 space-y-10 md:space-y-14">
        <div className="glass-panel rounded-3xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <Link
              href="/search"
              className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-black/90 transition-colors"
              aria-label="All Products"
            >
              <Package className="w-5 h-5" />
            </Link>
            <Link
              href="/search"
              className="w-10 h-10 rounded-full bg-white text-black border border-white/70 flex items-center justify-center hover:bg-white/90 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Link>
          </div>
        </div>
        {/* Hero Carousel */}
        <div className="rounded-3xl p-1 sm:p-2">
          <HeroCarousel />
        </div>

        {/* Trending Products */}
        <ProductRow
          title="Trending Now"
          icon={TrendingUp}
          subtitle="Most popular items this week"
          viewAllLink="/search"
          products={products.slice(0, 6)}
        />

        {/* Featured Stores */}
        <FeaturedStores />

        {/* Flash Deals */}
        <ProductRow
          title="Flash Deals"
          icon={Zap}
          subtitle="Limited time offers"
          viewAllLink="/search"
          products={products.slice(0, 8).map((p) => ({ ...p, badge: "SALE" }))}
        />

        {/* Tech Essentials */}
        <ProductRow
          title="Tech Essentials"
          icon={Laptop}
          subtitle="Electronics & Gadgets"
          viewAllLink="/search"
          products={products.filter((p) => p.category === "Electronics").slice(0, 8)}
        />

        {/* Textbooks */}
        <ProductRow
          title="Textbooks & Study Materials"
          icon={BookOpen}
          subtitle="Academic resources"
          viewAllLink="/search"
          products={products.filter((p) => p.category === "Books & Textbooks").slice(0, 8)}
        />

        {/* New Arrivals */}
        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-2xl">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">New Arrivals</h2>
                <p className="text-sm text-muted-text">Fresh products from campus stores</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} p={product} />
            ))}
          </div>
        </section>

        {/* Nearby Stores */}
        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-blue/10 rounded-2xl">
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

        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black">Why Students Love StudIQ</h2>
              <p className="text-sm text-muted-text">Premium features built for campus life.</p>
            </div>
            <Link
              href="/features"
              className="text-primary-blue font-medium text-xs px-3 py-1.5 rounded-full glass-pill hover:bg-white/90 transition-colors w-fit"
            >
              Explore all features
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((feature, index) => {
              return (
                <Link key={feature.slug} href={`/features#${feature.slug}`} className="block h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="group relative h-full overflow-hidden glass-card rounded-3xl border border-white/60 p-4 hover-lift"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent}`} />
                    <div className="absolute inset-0">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 90vw"
                        className="object-cover opacity-70"
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-[48%] backdrop-blur-lg bg-white/75" />
                    <div className="relative z-10 flex h-full flex-col justify-end gap-3 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="relative w-9 h-9 rounded-2xl overflow-hidden border border-white/70 shadow-sm bg-white/70">
                          <Image
                            src={feature.iconImage}
                            alt={`${feature.title} icon`}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-primary-blue uppercase tracking-wide">
                          {feature.badge}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-black">{feature.title}</h3>
                        <p className="text-xs text-muted-text mt-1.5">{feature.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-primary-blue text-[11px] font-semibold">
                        Learn more
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-primary-blue to-accent-blue rounded-3xl p-8 text-center text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-3">Start Selling on Campus</h2>
          <p className="text-lg text-black opacity-90 mb-6">
            Join hundreds of student entrepreneurs earning with StudIQ
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard/store")}
            className="px-8 py-3 bg-white text-primary-blue font-semibold rounded-full hover:bg-gray-100 transition-colors"
          >
            Create Your Store
          </button>
        </div>
      </div>
    </div>
  );
}
