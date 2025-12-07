"use client";

import useSWR from "swr";

export function usePoints(address: string | null) {
  const key = address ? `/api/points/history?address=${address}` : null;
  const { data, mutate } = useSWR(key, async (url) => (await fetch(url)).json());
  return { history: data ?? [], refresh: mutate };
}

