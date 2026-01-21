"use client";

import { createClient } from "@supabase/supabase-js";

export function useSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // Helper to get cookie on client side
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  };

  const sessionId = getCookie('sid');

  return createClient(url, key, {
    global: {
      headers: {
        'x-session-id': sessionId || '',
      }
    }
  });
}

