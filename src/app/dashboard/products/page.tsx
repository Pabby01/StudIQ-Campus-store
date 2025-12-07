"use client";

import { useWalletAuth } from "@/hooks/useWalletAuth";
import ProductForm from "@/components/ProductForm";
import useSWR from "swr";

type Product = Readonly<{ id: string; name: string; price: number }>;
type VendorProductsResponse = Readonly<{ storeId: string | null; products: Product[] }>;

export default function DashboardProductsPage() {
  const auth = useWalletAuth();
  const { data } = useSWR<VendorProductsResponse>(auth.address ? `/api/vendor/products?address=${auth.address}` : null, async (url: string) => (await fetch(url)).json());
  const storeId = data?.storeId ?? null;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Products</h1>
      {storeId ? (
        <>
          <ProductForm storeId={storeId} />
          <div className="grid gap-3 sm:grid-cols-2">
            {(data?.products ?? []).map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-zinc-600">${Number(p.price).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-sm text-zinc-600">Create a store to add products.</div>
      )}
    </div>
  );
}
