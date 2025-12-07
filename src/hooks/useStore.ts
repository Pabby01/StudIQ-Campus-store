"use client";

import useSWR from "swr";

export function useStore(id: string | null) {
  const key = id ? `/api/store/${id}` : null;
  const { data, mutate } = useSWR(key, async (url: string) => (await fetch(url)).json());
  return { store: data ?? null, refresh: mutate };
}

export function useVendorStores(address: string | null) {
  const key = address ? `/api/vendor/stores?address=${address}` : null;
  const { data } = useSWR(key, async (url: string) => (await fetch(url)).json());
  return { stores: data ?? [] };
}
