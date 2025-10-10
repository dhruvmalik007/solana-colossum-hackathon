import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import TVLChartClient from "../../../components/TVLChartClient";
import TradePanel from "../../../components/TradePanel";
import OrderBookClient from "../../../components/OrderBookClient";
import { getProtocolDetailSlimCached } from "../../../lib/server/defillama";
import MarketInsightsClient from "../../../components/MarketInsightsClient";

export default async function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProtocolDetailSlimCached(slug);
  if (!p) return notFound();

  const series = (p.solTvl || []).map((d: { date: number; totalLiquidityUSD: number }) => ({ x: new Date(d.date * 1000).toLocaleDateString(), y: d.totalLiquidityUSD }));
  const latest = series.at(-1)?.y ?? 0;
  const prev = series.at(-2)?.y ?? latest;
  const change1d = prev ? ((latest - prev) / prev) * 100 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-4">
          {p.logo ? (
            <Image src={p.logo} alt={p.name} width={48} height={48} className="rounded-lg" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-muted" />
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
            <p className="text-muted-foreground text-sm">{p.category ?? "Protocol"} • Solana</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">TVL over time</CardTitle>
              <CardDescription>DefiLlama data (Solana)</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Current TVL</div>
              <div className="font-mono">${Math.round(latest).toLocaleString()}</div>
            </div>
          </CardHeader>
          <CardContent>
            <TVLChartClient data={series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order book</CardTitle>
            <CardDescription>Mocked depth for demo</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderBookClient slug={slug} series={series} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trade</CardTitle>
            <CardDescription>Prediction ticket (UI only)</CardDescription>
          </CardHeader>
          <CardContent>
            <TradePanel change1d={change1d} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Insights</CardTitle>
            <CardDescription>AI-generated market summary (24h cache)</CardDescription>
          </CardHeader>
          <CardContent>
            <MarketInsightsClient
              slug={p.slug}
              name={p.name}
              category={p.category}
              latest={latest}
              change1d={change1d}
              seriesCount={series.length}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
            <CardDescription>Perplexity-ask driven summaries</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This market mirrors a prediction interface for the protocol&apos;s adoption on Solana using DefiLlama TVL as a reference metric. No real trading is enabled.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
