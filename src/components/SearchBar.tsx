"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget as HTMLFormElement);
        const qq = String(form.get("q") ?? "").trim();
        router.push(`/search?q=${encodeURIComponent(qq)}`);
      }}
    >
      <input name="q" defaultValue={q} className="w-full rounded-md border p-2" placeholder="Search products" />
      <button className="rounded-md border px-3">Search</button>
    </form>
  );
}

