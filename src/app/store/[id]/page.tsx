import StoreCard from "@/components/StoreCard";
import ProductCard from "@/components/ProductCard";
export const dynamic = "force-dynamic";

type Product = Readonly<{ id: string; name: string; price: number; image_url?: string | null; rating?: number | null }>;

async function fetchStore(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/store/${id}`, { cache: "no-store" });
  return res.json();
}

export default async function StorePage({ params }: { params: { id: string } }) {
  const s = await fetchStore(params.id);
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <StoreCard s={s} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(s.products as Product[] ?? []).map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
