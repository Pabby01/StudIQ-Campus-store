import ProductCard from "@/components/ProductCard";
export const dynamic = "force-dynamic";

async function fetchProduct(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/product/${id}`, { cache: "no-store" });
  return res.json();
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const p = await fetchProduct(params.id);
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Product</h1>
      <ProductCard p={p} />
    </div>
  );
}
