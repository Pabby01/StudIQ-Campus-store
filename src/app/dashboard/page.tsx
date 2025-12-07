"use client";

import { useWalletAuth } from "@/hooks/useWalletAuth";
import { usePoints } from "@/hooks/usePoints";

type PointLog = Readonly<{ points: number }>;

export default function DashboardPage() {
  const auth = useWalletAuth();
  const points = usePoints(auth.address ?? null);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="rounded-lg border p-4">
        <div className="text-sm">Points: {(points.history as PointLog[]).reduce((s, r) => s + r.points, 0)}</div>
      </div>
    </div>
  );
}
