import Link from "next/link";

type Product = Readonly<{ id: string; name: string; price: number; image_url?: string | null; rating?: number | null }>;

export default function ProductCard({ p }: { p: Product }) {
  return (
    <Link href={`/product/${p.id}`} className="block rounded-lg border p-3">
      {p.image_url && <img src={p.image_url} alt="" className="h-32 w-full rounded-md object-cover" />}
      <div className="mt-2 font-medium">{p.name}</div>
      <div className="text-sm text-zinc-600">${Number(p.price).toFixed(2)}</div>
      <div className="text-xs text-zinc-500">⭐ {p.rating?.toFixed?.(1) ?? "0.0"}</div>
    </Link>
  );
}

