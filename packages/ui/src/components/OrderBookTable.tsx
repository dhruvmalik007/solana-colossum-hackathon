"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import { cn } from "@repo/ui/lib/utils";
import { LineBar } from "@repo/ui/components/ui/line-bar";

export type BookLevel = { price: number; size: number; cumulative?: number };
export type Trade = { side: "buy" | "sell"; price: number; size: number; ts: number };

export function OrderBookTable({
  bids,
  asks,
  recentTrades,
  loading,
  className,
  prevBids,
  prevAsks,
  compact = true,
  maxRows = 10,
}: {
  bids: BookLevel[];
  asks: BookLevel[];
  recentTrades?: Trade[];
  loading?: boolean;
  className?: string;
  prevBids?: BookLevel[];
  prevAsks?: BookLevel[];
  compact?: boolean;
  maxRows?: number;
}) {
  const maxBid = bids.reduce((m, x) => Math.max(m, x.size), 0);
  const maxAsk = asks.reduce((m, x) => Math.max(m, x.size), 0);
  const prevBidMap = React.useMemo(() => new Map((prevBids || []).map((b) => [b.price, b.size])), [prevBids]);
  const prevAskMap = React.useMemo(() => new Map((prevAsks || []).map((a) => [a.price, a.size])), [prevAsks]);

  return (
    <div className={cn("grid gap-6 lg:grid-cols-2", className)}>
      <div>
        <div className="mb-2 text-sm font-semibold">Bids</div>
        <div className="max-h-[300px] overflow-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background/90 backdrop-blur">
              <TableRow className={compact ? "h-8" : undefined}>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.slice(0, maxRows).map((o, i) => {
                const prev = prevBidMap.get(o.price) || 0;
                const delta = o.size - prev;
                const up = delta > 0;
                const magnitude = Math.min(1, Math.abs(delta) / (maxBid || 1));
                return (
                  <TableRow key={`b-${i}`} className={cn("relative", compact ? "h-8" : undefined)}>
                    <TableCell className="font-medium">{o.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-28">
                          <LineBar value={maxBid ? o.size / maxBid : 0} align="right" color="emerald" secondary={delta !== 0 ? { value: magnitude, color: up ? "emerald" : "rose" } : undefined} />
                        </div>
                        <div className="min-w-[64px] text-right">
                          {o.size.toLocaleString()}
                          {delta !== 0 ? (
                            <span className={cn("ml-1 text-[11px]", up ? "text-emerald-600" : "text-rose-600")}>{up ? "+" : ""}{delta.toLocaleString()}</span>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold">Asks</div>
        <div className="max-h-[300px] overflow-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background/90 backdrop-blur">
              <TableRow className={compact ? "h-8" : undefined}>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asks.slice(0, maxRows).map((o, i) => {
                const prev = prevAskMap.get(o.price) || 0;
                const delta = o.size - prev;
                const up = delta > 0;
                const magnitude = Math.min(1, Math.abs(delta) / (maxAsk || 1));
                return (
                  <TableRow key={`a-${i}`} className={cn("relative", compact ? "h-8" : undefined)}>
                    <TableCell className="font-medium">{o.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-28">
                          <LineBar value={maxAsk ? o.size / maxAsk : 0} align="right" color="rose" secondary={delta !== 0 ? { value: magnitude, color: up ? "emerald" : "rose" } : undefined} />
                        </div>
                        <div className="min-w-[64px] text-right">
                          {o.size.toLocaleString()}
                          {delta !== 0 ? (
                            <span className={cn("ml-1 text-[11px]", up ? "text-emerald-600" : "text-rose-600")}>{up ? "+" : ""}{delta.toLocaleString()}</span>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      {recentTrades && recentTrades.length > 0 ? (
        <div className="lg:col-span-2">
          <div className="mb-2 text-sm font-semibold">Recent Trades</div>
          <div className="max-h-[200px] overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background/90 backdrop-blur">
                <TableRow className={compact ? "h-8" : undefined}>
                  <TableHead>Side</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrades.slice(0, maxRows).map((t, i) => (
                  <TableRow key={`t-${i}`} className={compact ? "h-8" : undefined}>
                    <TableCell className={cn(t.side === "buy" ? "text-emerald-600" : "text-rose-600")}>{t.side.toUpperCase()}</TableCell>
                    <TableCell>{t.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{t.size.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{new Date(t.ts).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
