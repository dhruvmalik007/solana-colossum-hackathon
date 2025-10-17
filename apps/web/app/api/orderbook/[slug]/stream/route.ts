import { NextRequest } from "next/server";
import { listOrdersByMarket, listTradesByMarket } from "@repo/database";

type BookLevel = { price: number; size: number };
type Trade = { side: "buy" | "sell"; price: number; size: number; ts: number };

function aggregateLevels(orders: { price: number; remaining: number }[]): BookLevel[] {
  const map = new Map<number, number>();
  for (const o of orders) {
    const s = map.get(o.price) ?? 0;
    map.set(o.price, s + Math.max(0, o.remaining));
  }
  return Array.from(map.entries())
    .map(([price, size]) => ({ price, size }))
    .filter((l) => l.size > 0);
}

async function buildSnapshot(slug: string) {
  const [orders, trades] = await Promise.all([
    listOrdersByMarket(slug),
    listTradesByMarket(slug),
  ]);
  const bids = aggregateLevels(orders.filter((o) => o.side === "Buy"))
    .sort((a, b) => b.price - a.price)
    .slice(0, 16);
  const asks = aggregateLevels(orders.filter((o) => o.side === "Sell"))
    .sort((a, b) => a.price - b.price)
    .slice(0, 16);
  const recentTrades: Trade[] = trades
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, 20)
    .map((t) => ({ side: t.side === "Buy" ? "buy" : "sell", price: t.avgPrice, size: t.size, ts: Date.parse(t.createdAt) }));
  return { bids, asks, recentTrades };
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (obj: any) => {
        controller.enqueue(encoder.encode(`event: message\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      // initial snapshot
      const snapshot = await buildSnapshot(slug).catch(() => ({ bids: [], asks: [], recentTrades: [] }));
      enqueue({ type: "snapshot", data: snapshot });

      const interval = setInterval(async () => {
        try {
          const update = await buildSnapshot(slug);
          enqueue({ type: "update", data: update });
        } catch {
          // ignore to keep stream alive
        }
      }, 1500);

      const close = () => {
        clearInterval(interval);
        controller.close();
      };
      // @ts-ignore
      req.signal?.addEventListener?.("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
