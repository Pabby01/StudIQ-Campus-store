"use client";

import { useEffect, useState } from "react";
import StoreCard from "@/components/StoreCard";
import { Search, MapPin, Star, TrendingUp, Filter } from "lucide-react";
import Button from "@/components/ui/Button";
import { encodeGeohash } from "@/lib/geohash";

type Store = Readonly<{
  id: string;
  name: string;
  category: string;
  banner_url?: string | null;
  description?: string | null;
  rating?: number;
  cashback?: number;
}>;

const categories = ["All", "Food & Dining", "Groceries", "Academic", "Electronics", "Fashion", "Services"];

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "cashback" | "distance">("rating");

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch("/api/store/all?limit=100");
        if (res.ok) {
          const data = await res.json();
          setStores(data.stores || []);
        }
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const filteredStores = stores
    .filter((store) => {
      if (selectedCategory !== "All" && store.category !== selectedCategory) return false;
      if (searchQuery && !store.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "cashback") return (b.cashback || 0) - (a.cashback || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-blue to-accent-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-3">Campus Stores</h1>
          <p className="text-lg opacity-90 mb-6">
            Earn cashback and rewards at campus stores. Browse by category and pay with your wallet.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text" />
              <input
                type="text"
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="bg-white border-b border-border-gray sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                    ? "bg-primary-blue text-white"
                    : "bg-soft-gray-bg text-muted-text hover:bg-gray-200"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted-text" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-soft-gray-bg border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="rating">Highest Rated</option>
                <option value="cashback">Best Cashback</option>
                <option value="distance">Nearest</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Stores */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">Featured Stores</h2>
              <p className="text-sm text-muted-text">Top-rated stores on campus</p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStores.slice(0, 3).map((store) => (
              <div key={store.id} className="relative">
                <div className="absolute top-3 right-3 z-10 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                  FEATURED
                </div>
                <StoreCard s={store} />
              </div>
            ))}
          </div>
        </section>

        {/* Trending Stores */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">Trending Now</h2>
              <p className="text-sm text-muted-text">Popular this week</p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStores.slice(3, 6).map((store) => (
              <div key={store.id} className="relative">
                <div className="absolute top-3 right-3 z-10 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                  TRENDING
                </div>
                <StoreCard s={store} />
              </div>
            ))}
          </div>
        </section>

        {/* All Stores */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MapPin className="w-6 h-6 text-primary-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">All Stores</h2>
              <p className="text-sm text-muted-text">
                {filteredStores.length} stores {selectedCategory !== "All" && `in ${selectedCategory}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border-gray h-64 animate-pulse" />
              ))}
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-border-gray">
              <MapPin className="w-16 h-16 text-muted-text mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No stores found</h3>
              <p className="text-muted-text mb-6">Try adjusting your filters or search query</p>
              <Button variant="primary" onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStores.map((store) => (
                <StoreCard key={store.id} s={store} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
