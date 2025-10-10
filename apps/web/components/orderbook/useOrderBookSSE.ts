"use client";

import * as React from "react";
import type { BookLevel, Trade } from "@repo/ui/components/OrderBookTable";

export type OrderBookSnapshot = {
  bids: BookLevel[];
  asks: BookLevel[];
  recentTrades: Trade[];
};

export function useOrderBookSSE(slug: string) {
  const [data, setData] = React.useState<OrderBookSnapshot>({ bids: [], asks: [], recentTrades: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    const url = `/api/orderbook/${encodeURIComponent(slug)}/stream`;
    const es = new EventSource(url);

    es.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data);
        if (parsed?.data) {
          setData(parsed.data as OrderBookSnapshot);
          setLoading(false);
        }
      } catch (e: any) {
        setError(e?.message ?? "Bad event data");
      }
    };
    es.onerror = () => {
      setError("Stream error");
      es.close();
    };

    return () => es.close();
  }, [slug]);

  return { data, loading, error } as const;
}
