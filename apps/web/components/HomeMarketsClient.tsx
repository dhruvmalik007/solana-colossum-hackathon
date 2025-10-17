"use client";

import Link from "next/link";
import * as React from "react";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { AnimatedCard } from "@repo/ui/components/animated-card";
import { useDailyJSON } from "../lib/client/useDailyJSON";

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

export default function HomeMarketsClient() {
  const { data, loading, error } = useDailyJSON<{ data: Market[] } | Market[]>(
    "home:markets:v1",
    "/api/markets",
    60 * 60 * 1000
  );

  const list: Market[] = React.useMemo(() => {
    if (!data) return [];
    const arr = Array.isArray(data) ? data : (data as any).data;
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  if (loading) {
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

  if (!list || list.length === 0) {
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {list.slice(0, 12).map((m) => (
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
  );
}
