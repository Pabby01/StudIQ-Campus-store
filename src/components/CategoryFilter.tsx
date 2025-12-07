"use client";

import { useRouter, useSearchParams } from "next/navigation";

const categories = ["All", "Food", "Groceries", "Academic", "Electronics", "Fashion"];

export default function CategoryFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("category") ?? "All";
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <button
          key={c}
          className={`rounded-full border px-3 py-1 text-sm ${active === c ? "bg-black text-white" : ""}`}
          onClick={() => router.push(`/search?category=${encodeURIComponent(c === "All" ? "" : c)}`)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

