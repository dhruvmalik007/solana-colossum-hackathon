"use client";

import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CollateralBar } from "./CollateralBar";
import { FeeBreakdown } from "./FeeBreakdown";

export function TradePanel({ slug }: { slug: string }) {
  const [side, setSide] = React.useState<"Buy" | "Sell">("Buy");
  const [size, setSize] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [quote, setQuote] = React.useState<null | {
    avgPrice: number;
    slippage: number;
    feeUSD: number;
    feeBps: { platformBps: number; creatorBps: number };
  }>(null);

  const collateral = Math.max(0, size);
  const required = Math.ceil(collateral * 1.1);
  const posted = collateral;
  const platformBps = quote?.feeBps.platformBps ?? 30;
  const creatorBps = quote?.feeBps.creatorBps ?? 20;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string | undefined;
  const base = (API_BASE && API_BASE.replace(/\/$/, "")) || "/api";

  async function getQuote() {
    setLoading(true);
    setError(null);
    setQuote(null);
    try {
      const res = await fetch(`${base}/quotes/pmamm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId: slug, side, size }),
      });
      if (!res.ok) throw new Error(`quote ${res.status}`);
      const body = await res.json();
      setQuote({
        avgPrice: Number(body?.data?.avgPrice ?? 0.5),
        slippage: Number(body?.data?.slippage ?? 0),
        feeUSD: Number(body?.data?.feeUSD ?? 0),
        feeBps: {
          platformBps: Number(body?.data?.feeBps?.platformBps ?? 30),
          creatorBps: Number(body?.data?.feeBps?.creatorBps ?? 20),
        },
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to quote");
    } finally {
      setLoading(false);
    }
  }

  async function submitTrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${base}/trades/pmamm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId: slug, side, size, quote }),
      });
      if (!res.ok) throw new Error(`trade ${res.status}`);
      const body = await res.json();
      // For MVP, just log/ack. A real impl would present tx for signing.
      console.log("trade result", body);
    } catch (e: any) {
      setError(e?.message ?? "Failed to trade");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button variant={side === "Buy" ? "default" : "outline"} size="sm" onClick={() => setSide("Buy")}>Buy</Button>
          <Button variant={side === "Sell" ? "default" : "outline"} size="sm" onClick={() => setSide("Sell")}>Sell</Button>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Size</div>
          <Input type="number" value={Number.isFinite(size) ? size : 0} onChange={(e) => setSize(parseFloat(e.target.value) || 0)} />
        </div>
        {error && <div className="text-xs text-rose-600">{error}</div>}
        {quote && (
          <div className="rounded-md border p-2 text-xs space-y-1">
            <div>Avg Price: <span className="font-medium">{quote.avgPrice.toFixed(4)}</span></div>
            <div>Slippage: <span className="font-medium">{(quote.slippage * 100).toFixed(2)}%</span></div>
            <div>Fees (USD est): <span className="font-medium">{quote.feeUSD.toFixed(2)}</span></div>
          </div>
        )}
        <CollateralBar required={required} posted={posted} />
        <FeeBreakdown platformBps={platformBps} creatorBps={creatorBps} sizeUSD={posted} />
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" disabled={loading || size <= 0} onClick={getQuote}>Get Quote</Button>
        <Button disabled={loading || size <= 0} onClick={submitTrade}>Submit</Button>
      </CardFooter>
    </Card>
  );
}
