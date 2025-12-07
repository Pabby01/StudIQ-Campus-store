async function getMarkets() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/kalshi/markets`, { cache: "no-store" });
  return res.json();
}

type Market = Readonly<{ id: string; title: string }>;

export default async function PredictionPage() {
  const markets: Market[] = await getMarkets();
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Prediction Markets</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {markets.map((m) => (
          <div key={m.id} className="rounded-lg border p-3">
            <div className="font-medium">{m.title}</div>
            <div className="mt-2 flex gap-2">
              <button className="rounded-md border px-3 py-1">Yes</button>
              <button className="rounded-md border px-3 py-1">No</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
