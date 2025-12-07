import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
export const dynamic = "force-dynamic";

type Product = Readonly<{ id: string; name: string; price: number; image_url?: string | null; rating?: number | null }>;

async function fetchProducts(q?: string, category?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/product/search?${params.toString()}`);
  const data = await res.json();
  return data as Product[];
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const sp = await searchParams;
  const products = await fetchProducts(sp.q, sp.category);
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <SearchBar />
      <CategoryFilter />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
