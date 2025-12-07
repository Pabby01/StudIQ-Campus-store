import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

type Product = Readonly<{
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  rating?: number | null;
  category?: string;
}>;

async function fetchProducts(q?: string, category?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/product/search?${params.toString()}`, { cache: "no-store" });
  const data = await res.json();
  return data as Product[];
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const products = await fetchProducts(sp.q, sp.category);

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Browse Products</h1>
            <p className="text-muted-text">
              {sp.q ? `Search results for "${sp.q}"` : "Explore all products on campus"}
            </p>
          </div>

          {/* Search Bar */}
          <SearchBar />

          {/* Category Filter */}
          <CategoryFilter />
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-text">
            {products.length} {products.length === 1 ? "product" : "products"} found
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-border-gray">
            <Package className="w-16 h-16 text-muted-text mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No products found</h3>
            <p className="text-muted-text">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
