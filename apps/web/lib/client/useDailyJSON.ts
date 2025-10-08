"use client";

import * as React from "react";

export function useDailyJSON<T = unknown>(key: string, url: string, ttlMs = 24 * 60 * 60 * 1000) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let canceled = false;
    const now = Date.now();

    const readLocal = () => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { t: number; d: T };
        if (now - parsed.t < ttlMs) return parsed.d;
        return null;
      } catch {
        return null;
      }
    };

    const cached = readLocal();
    if (cached) {
      console.log(`[useDailyJSON] ${key} cache hit`);
      setData(cached);
      setLoading(false);
      return;
    }

    console.log(`[useDailyJSON] ${key} cache miss, fetching ${url}`);
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        console.log(`[useDailyJSON] ${key} fetch response:`, res.status, res.ok);
        if (!res.ok) throw new Error(`fetch ${url} ${res.status}`);
        const body = (await res.json()) as any;
        console.log(`[useDailyJSON] ${key} body:`, body);
        const d = (body?.data ?? body) as T;
        if (!canceled) {
          setData(d);
          setLoading(false);
          try {
            localStorage.setItem(key, JSON.stringify({ t: now, d }));
            console.log(`[useDailyJSON] ${key} cached to localStorage`);
          } catch (e) {
            console.warn(`[useDailyJSON] ${key} localStorage write failed:`, e);
          }
        }
      } catch (e: any) {
        console.error(`[useDailyJSON] ${key} fetch error:`, e);
        if (!canceled) {
          setError(e?.message ?? "error");
          setLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [key, url, ttlMs]);

  return { data, loading, error } as const;
}
