"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { AnimatedCard } from "@repo/ui/components/animated-card";
import { useDailyJSON } from "../lib/client/useDailyJSON";
import { API_BASE } from "@/lib/client/api";

type Protocol = {
  slug: string;
  name: string;
  category: string;
  chains: string[];
  tvl: number;
  change_1d?: number;
  logo?: string;
};

export default function HomeProtocolsClient() {
  const { data, loading, error } = useDailyJSON<Protocol[]>(
    "home:protocols:v2",
    `${(API_BASE || "").replace(/\/$/, "")}/protocols`,
    24 * 60 * 60 * 1000
  );
  const list: Protocol[] = Array.isArray(data) ? data : [];

  React.useEffect(() => {
    console.log("[HomeProtocolsClient] loading:", loading, "error:", error, "data:", data, "list length:", list.length);
  }, [loading, error, data, list.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading protocols...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-500 p-8 text-center">
        <p className="text-rose-600">Error loading protocols: {error}</p>
        <p className="text-sm text-muted-foreground mt-2">Check console and /api/protocols endpoint.</p>
      </div>
    );
  }

  if (!list || list.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No protocols found. Check console and /api/protocols.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {list.slice(0, 12).map((p: Protocol) => (
        <AnimatedCard key={p.slug}>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              {p.logo ? (
                <Image src={p.logo} alt={p.name} width={32} height={32} className="rounded-md" />
              ) : (
                <div className="h-8 w-8 rounded-md bg-muted" />
              )}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{p.name}</CardTitle>
                <CardDescription className="text-xs">{p.category}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">TVL</span>
              <span className="font-mono text-sm font-medium">${Math.round((p.tvl || 0) / 1_000_000)}M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">1d change</span>
              <span className={`text-sm font-medium ${p.change_1d && p.change_1d >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {typeof p.change_1d === "number" ? `${p.change_1d >= 0 ? "+" : ""}${p.change_1d.toFixed(2)}%` : "–"}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-2 pt-3 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 px-3">Yes</Button>
              <Button variant="outline" size="sm" className="h-8 px-3">No</Button>
            </div>
            <Link href={`/markets/${p.slug}`}>
              <Button size="sm" className="h-8">View market</Button>
            </Link>
          </CardFooter>
        </AnimatedCard>
      ))}
    </div>
  );
}
