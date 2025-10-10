"use client";

import * as React from "react";
import { Tabs , TabsList , TabsTrigger , TabsContent } from "@repo/ui/components/ui/tabs";
import { OrderBookTable } from "@repo/ui/components/OrderBookTable";
import { Spinner } from "@repo/ui/components/ui/spinner";
import TVLChartClient, { TVLPoint } from "./TVLChartClient";
import { useOrderBookSSE } from "./orderbook/useOrderBookSSE";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Button } from "@repo/ui/components/ui/button";
import { TxnStatus } from "@repo/ui/components/TxnStatus";
import { usePlaceRangeOrder } from "./orders/usePlaceRangeOrder";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// React 19 interop casts

export default function OrderBookClient({ slug, series }: { slug: string; series: TVLPoint[] }) {
  const { data, loading, error } = useOrderBookSSE(slug);
  const prevRef = React.useRef<typeof data | null>(null);
  React.useEffect(() => {
    prevRef.current = data;
  }, [data]);

  const [rangeMin, setRangeMin] = React.useState<string>("");
  const [rangeMax, setRangeMax] = React.useState<string>("");
  const [volume, setVolume] = React.useState<string>("");
  const { state, placeOrder } = usePlaceRangeOrder(slug);

  return (
    <>
    <Tabs defaultValue="book">
      <TabsList>
        <TabsTrigger value="book">Order Book</TabsTrigger>
        <TabsTrigger value="depth">Depth</TabsTrigger>
        <TabsTrigger value="graph">Graph</TabsTrigger>
      </TabsList>
      <TabsContent value="book">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : error ? (
          <div className="text-sm text-rose-600">{error}</div>
        ) : (
          <>
            <OrderBookTable
              bids={data.bids}
              asks={data.asks}
              prevBids={prevRef.current?.bids}
              prevAsks={prevRef.current?.asks}
              recentTrades={data.recentTrades}
              compact
              maxRows={12}
            />
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Place order by outcome range</CardTitle>
                <CardDescription>Enter a volume for a specific outcome interval</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div>
                  <Label htmlFor="omin">Outcome min</Label>
                  <Input id="omin" type="number" value={rangeMin} onChange={(e) => setRangeMin(e.target.value)} placeholder="e.g. 95000" />
                </div>
                <div>
                  <Label htmlFor="omax">Outcome max</Label>
                  <Input id="omax" type="number" value={rangeMax} onChange={(e) => setRangeMax(e.target.value)} placeholder="e.g. 105000" />
                </div>
                <div>
                  <Label htmlFor="vol">Volume (USDC)</Label>
                  <Input id="vol" type="number" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="e.g. 250" />
                </div>
                <div className="flex items-end">
                  <Button
                    className="w-full"
                    disabled={!rangeMin || !rangeMax || !volume}
                    onClick={() => placeOrder(Number(rangeMin), Number(rangeMax), Number(volume))}
                  >
                    Place order
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="mt-3">
              <TxnStatus state={state} />
            </div>
          </>
        )}
      </TabsContent>
      <TabsContent value="depth">
        <div className="h-[260px] w-full">
          <ResponsiveContainer>
            <AreaChart data={buildDepth(data)} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <XAxis dataKey="price" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={28} />
              <Tooltip formatter={(v: any) => (typeof v === "number" ? v.toLocaleString() : v)} />
              <Area type="stepAfter" dataKey="bidCum" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
              <Area type="stepAfter" dataKey="askCum" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </TabsContent>
      <TabsContent value="graph">
        <TVLChartClient data={series} />
      </TabsContent>
    </Tabs>
    </>
  );
}

function buildDepth(data: { bids: { price: number; size: number }[]; asks: { price: number; size: number }[] }) {
  const bids = [...(data?.bids || [])].sort((a, b) => b.price - a.price);
  const asks = [...(data?.asks || [])].sort((a, b) => a.price - b.price);
  let bc = 0;
  let ac = 0;
  const rows = new Map<number, { price: number; bidCum?: number; askCum?: number }>();
  for (const b of bids) {
    bc += b.size;
    rows.set(b.price, { price: b.price, ...(rows.get(b.price) || {}), bidCum: bc });
  }
  for (const a of asks) {
    ac += a.size;
    rows.set(a.price, { price: a.price, ...(rows.get(a.price) || {}), askCum: ac });
  }
  return Array.from(rows.values()).sort((x, y) => x.price - y.price);
}

