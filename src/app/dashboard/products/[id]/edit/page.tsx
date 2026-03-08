import ProductForm from "@/components/ProductForm";

async function fetchProduct(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/product/${id}`, { cache: "no-store" });
  return res.json();
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const p = await fetchProduct(params.id);
  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 py-6 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-3xl mx-auto space-y-6 w-full">
        <div className="glass-panel rounded-3xl p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-black">Edit Product</h1>
          <p className="text-sm text-muted-text">Update product details</p>
        </div>
        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/60">
          <ProductForm storeId={p.store_id} initial={p} />
        </div>
      </div>
    </div>
  );
}
