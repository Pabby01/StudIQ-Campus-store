"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import StoreCard from "@/components/StoreCard";
import { encodeGeohash } from "@/lib/geohash";

type Product = Readonly<{ id: string; name: string; price: number; image_url?: string | null; rating?: number | null }>;
type Store = Readonly<{ id: string; name: string; category: string; banner_url?: string | null }>;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);

  useEffect(() => {
    fetch("/api/product/search").then((r) => r.json()).then(setProducts);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const gh = encodeGeohash(pos.coords.latitude, pos.coords.longitude, 6);
        fetch(`/api/store/nearby?geoprefix=${gh.substring(0, 5)}`).then((r) => r.json()).then(setNearbyStores);
      }, () => {
        fetch(`/api/store/nearby?geoprefix=`).then((r) => r.json()).then(setNearbyStores);
      });
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Campus Store</h1>
        <p className="text-sm text-zinc-600">Discover nearby stores, earn rewards, and pay with Solana.</p>
      </header>
      <nav className="mt-6 flex gap-3">
        <Link className="rounded-md border px-3 py-1" href="/search">Browse</Link>
        <Link className="rounded-md border px-3 py-1" href="/cart">Cart</Link>
        <Link className="rounded-md border px-3 py-1" href="/prediction">Prediction</Link>
      </nav>
      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Featured Products</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Nearby Stores</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nearbyStores.slice(0, 6).map((s) => (
            <StoreCard key={s.id} s={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
