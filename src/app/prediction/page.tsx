import Card from "@/components/ui/Card";
import { TrendingUp } from "lucide-react";

async function getMarkets() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/kalshi/markets`, { cache: "no-store" });
  return res.json();
}

type Market = Readonly<{ id: string; title: string }>;

export default async function PredictionPage() {
  const markets: Market[] = await getMarkets();

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Prediction Markets</h1>
            <p className="text-muted-text">Trade on future events and outcomes</p>
          </div>
        </div>

        {/* Markets Grid */}
        {markets.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((m) => (
              <Card key={m.id} hover>
                <h3 className="font-semibold text-black mb-4">{m.title}</h3>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors">
                    Yes
                  </button>
                  <button className="flex-1 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors">
                    No
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <TrendingUp className="w-16 h-16 text-muted-text mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No markets available</h3>
            <p className="text-muted-text">Check back soon for prediction markets</p>
          </Card>
        )}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
