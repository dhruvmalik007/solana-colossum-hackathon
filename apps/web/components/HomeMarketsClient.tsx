"use client";

import Link from "next/link";
import * as React from "react";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { AnimatedCard } from "@repo/ui/components/animated-card";

export type Market = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  createdAt: string;
  resolutionTime?: string;
  status: "Draft" | "Active" | "Resolving" | "Resolved";
};

export default function HomeMarketsClient({ category, q, status, sort }: { category?: string; q?: string; status?: string; sort?: string }) {
  const [items, setItems] = React.useState<Market[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const buildUrl = React.useCallback(
    (cursor?: string | null) => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (q) params.set("q", q!);
      if (status) params.set("status", status);
      if (sort) params.set("sort", sort);
      params.set("limit", "24");
      if (cursor && Number(cursor) > 0) params.set("cursor", cursor);
      const base = API_BASE;
      return `${base}/markets?${params.toString()}`;
    },
    [category, q, status, sort]
  );

  const loadInitial = React.useCallback(async () => {
    try {
      setInitialLoading(true);
      setError(null);
      setItems([]);
      setNextCursor(null);
      const res = await fetch(buildUrl(null), { cache: "no-store" });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const body = (await res.json()) as { data: Market[]; nextCursor?: string | null };
      setItems(body.data || []);
      setNextCursor((body as any).nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message ?? "error");
    } finally {
      setInitialLoading(false);
    }
  }, [buildUrl]);

  const loadMore = React.useCallback(async () => {
    if (loadingMore) return;
    if (!nextCursor) return;
    try {
      setLoadingMore(true);
      const res = await fetch(buildUrl(nextCursor), { cache: "no-store" });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const body = (await res.json()) as { data: Market[]; nextCursor?: string | null };
      setItems((prev) => [...prev, ...(body.data || [])]);
      setNextCursor((body as any).nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message ?? "error");
    } finally {
      setLoadingMore(false);
    }
  }, [buildUrl, nextCursor, loadingMore]);

  // Reset and load when filters change
  React.useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // IntersectionObserver to auto-load more
  React.useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Defer to next tick to avoid tight loops
            setTimeout(() => loadMore(), 0);
          }
        }
      },
      { rootMargin: "400px 0px 400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading markets…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-500 p-8 text-center">
        <p className="text-rose-600">Error loading markets: {error}</p>
        <p className="text-sm text-muted-foreground mt-2">Check console and /api/markets endpoint.</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No markets yet. Create one to get started.</p>
        <div className="mt-4">
          <Link href="/create">
            <Button>Create Market</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <AnimatedCard key={m.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-muted" />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{m.title}</CardTitle>
                  <CardDescription className="text-xs">{m.category || "Market"}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className="font-mono text-sm font-medium">{m.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Resolution</span>
                <span className="text-sm">{m.resolutionTime ? new Date(m.resolutionTime).toLocaleDateString() : "—"}</span>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-2 pt-3 border-t">
              <Link href={`/markets/${m.slug}`}>
                <Button size="sm" className="h-8">View market</Button>
              </Link>
              <Link href={`/markets/${m.slug}`}>
                <Button variant="outline" size="sm" className="h-8">Trade</Button>
              </Link>
            </CardFooter>
          </AnimatedCard>
        ))}
      </div>

      <div className="flex items-center justify-center py-6">
        {loadingMore && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading more…
          </div>
        )}
        {!loadingMore && nextCursor && (
          <Button variant="outline" onClick={loadMore}>Load more</Button>
        )}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </>
  );
}
