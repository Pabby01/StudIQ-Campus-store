/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import { Loader2, Package, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

type Product = Readonly<{
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  rating?: number | null;
  category?: string;
}>;

// Internal component containing the logic
function SearchPageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(64);
  const [total, setTotal] = useState(0);
  const cacheRef = useRef(new Map<string, { products: Product[]; total: number }>());
  const inflightRef = useRef<AbortController | null>(null);
  const sortConfig: Record<string, { sortBy: string; order: "asc" | "desc" }> = {
    created_at: { sortBy: "created_at", order: "desc" },
    price: { sortBy: "price", order: "asc" },
    name: { sortBy: "name", order: "asc" },
    rating: { sortBy: "rating", order: "desc" },
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const handleChange = () => {
      setLimit(mediaQuery.matches ? 10 : 64);
    };
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy, page, limit]);

  const fetchProducts = async () => {
    const currentOffset = (page - 1) * limit;

    try {
      const activeSort = sortConfig[sortBy] || sortConfig.created_at;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
        sortBy: activeSort.sortBy,
        order: activeSort.order,
      });

      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);

      const cacheKey = params.toString();
      const cached = cacheRef.current.get(cacheKey);
      const isInitial = page === 1 && products.length === 0 && !cached;

      setLoading(isInitial);
      setPageLoading(!isInitial);

      if (cached) {
        setProducts(cached.products);
        setTotal(cached.total);
      }

      if (inflightRef.current) {
        inflightRef.current.abort();
      }
      const controller = new AbortController();
      inflightRef.current = controller;

      const res = await fetch(`/api/product/search?${params}`, { signal: controller.signal });
      const data = await res.json();

      if (data.ok) {
        setProducts(data.products);
        setTotal(data.total || 0);
        cacheRef.current.set(cacheKey, { products: data.products || [], total: data.total || 0 });

        const hasMore = (data.total || 0) > currentOffset + limit;
        if (hasMore) {
          const nextOffset = currentOffset + limit;
          const nextParams = new URLSearchParams({
            limit: limit.toString(),
            offset: nextOffset.toString(),
            sortBy: activeSort.sortBy,
            order: activeSort.order,
          });
          if (searchQuery) nextParams.set("q", searchQuery);
          if (selectedCategory) nextParams.set("category", selectedCategory);
          const nextKey = nextParams.toString();

          if (!cacheRef.current.has(nextKey)) {
            fetch(`/api/product/search?${nextParams}`)
              .then((nextRes) => nextRes.json())
              .then((nextData) => {
                if (nextData?.ok) {
                  cacheRef.current.set(nextKey, {
                    products: nextData.products || [],
                    total: nextData.total || 0,
                  });
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        throw error;
      }
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === "All" ? "" : category);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 sm:pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-6 glass-panel rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-blue via-fuchsia-500 to-emerald-400" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-primary-blue/10 px-3 py-1 text-xs font-semibold text-primary-blue">
                <Sparkles className="w-3.5 h-3.5" /> Student search
              </p>
              <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">Search Products</h1>
              <p className="text-sm text-slate-500">Find campus essentials, fast.</p>
            </div>
            {!loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm"
              >
                {total > 0 ? `${total} results` : "No results"}
              </motion.div>
            )}
          </div>
          <SearchBar onSearch={handleSearch} />
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06, ease: "easeOut" }}
          className="mb-6 glass-panel rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex-1 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-fuchsia-50 p-3">
            <CategoryFilter
              selected={selectedCategory}
              onChange={handleCategoryChange}
            />
          </div>

          <motion.select
            whileTap={{ scale: 0.98 }}
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 glass-pill rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue border border-white/60 bg-white shadow-sm"
          >
            <option value="created_at">Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="name">Name: A to Z</option>
            <option value="rating">Highest Rated</option>
          </motion.select>
        </motion.div>

        {/* Results */}
        {loading && page === 1 ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl border border-white/60 h-80 animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 glass-panel rounded-3xl border border-white/60"
          >
            <Package className="w-16 h-16 text-muted-text mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No products found</h3>
            <p className="text-muted-text mb-6">
              Try adjusting your search or filters
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-8">
              <AnimatePresence mode="popLayout">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.25, delay: index * 0.01, ease: "easeOut" }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    <ProductCard p={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {total > limit && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={loading || pageLoading || page === 1}
                >
                  Prev
                </Button>
                {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map(
                  (pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === page ? "primary" : "outline"}
                      onClick={() => setPage(pageNumber)}
                      disabled={loading || pageLoading}
                    >
                      {pageNumber}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    setPage((prev) => Math.min(Math.ceil(total / limit), prev + 1))
                  }
                  disabled={loading || pageLoading || page === Math.ceil(total / limit)}
                >
                  Next
                </Button>
                {pageLoading && (
                  <Loader2 className="w-4 h-4 text-primary-blue animate-spin" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Wrapper component with Suspense
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
