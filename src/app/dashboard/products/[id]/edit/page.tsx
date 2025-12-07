import ProductForm from "@/components/ProductForm";

async function fetchProduct(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/product/${id}`, { cache: "no-store" });
  return res.json();
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const p = await fetchProduct(params.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit Product</h1>
      <ProductForm storeId={p.store_id} initial={p} />
    </div>
  );
}
