"use client";

import * as React from "react";
import { OrderBookTable } from "@repo/ui/components/OrderBookTable";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { useOrderBookSSE } from "./orderbook/useOrderBookSSE";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Button } from "@repo/ui/components/ui/button";
import { TxnStatus } from "@repo/ui/components/TxnStatus";
import { usePlaceRangeOrder } from "./orders/usePlaceRangeOrder";

// React 19 interop casts

export default function OrderBookClient({ slug }: { slug: string }) {
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
    </>
  );
}

