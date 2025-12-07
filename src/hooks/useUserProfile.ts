"use client";

import useSWR from "swr";

export function useUserProfile(address: string | null) {
  const key = address ? `/api/profile/get?address=${address}` : null;
  const { data, mutate } = useSWR(key, async (url) => {
    const res = await fetch(url);
    return res.json();
  });
  return { profile: data ?? null, refresh: mutate };
}

