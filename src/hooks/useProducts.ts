"use client";

import useSWR from "swr";

export function useProducts(q?: string, category?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const { data } = useSWR(`/api/product/search?${params.toString()}`, async (url: string) => (await fetch(url)).json());
  return { products: data ?? [] };
}
