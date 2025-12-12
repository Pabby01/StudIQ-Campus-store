"use client";

import { useEffect, useState, Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import { Loader2, Package } from "lucide-react";
import Button from "@/components/ui/Button";

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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 24;

  useEffect(() => {
    fetchProducts(true);
  }, [selectedCategory, searchQuery, sortBy]);

  const fetchProducts = async (reset = false) => {
    setLoading(true);
    const currentOffset = reset ? 0 : offset;

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
        sortBy,
      });

      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await fetch(`/api/product/search?${params}`);
      const data = await res.json();

      if (data.ok) {
        setProducts(reset ? data.products : [...products, ...data.products]);
        setHasMore(data.hasMore);
        setOffset(reset ? limit : currentOffset + limit);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setOffset(0);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setOffset(0);
  };

  const loadMore = () => {
    fetchProducts(false);
  };

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-4">Search Products</h1>
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CategoryFilter
            selected={selectedCategory}
            onChange={handleCategoryChange}
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="created_at">Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="name">Name: A to Z</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {/* Results */}
        {loading && offset === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-border-gray h-80 animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-border-gray">
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
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} p={product} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
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
