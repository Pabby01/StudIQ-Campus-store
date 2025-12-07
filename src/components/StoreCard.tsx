import Link from "next/link";

type Store = Readonly<{ id: string; name: string; category: string; description?: string | null; banner_url?: string | null; rating?: number | null }>;

export default function StoreCard({ s }: { s: Store }) {
  return (
    <Link href={`/store/${s.id}`} className="block rounded-lg border p-3">
      {s.banner_url && <img src={s.banner_url} alt="" className="h-32 w-full rounded-md object-cover" />}
      <div className="mt-2 font-medium">{s.name}</div>
      <div className="text-sm text-zinc-600">{s.category}</div>
    </Link>
  );
}

