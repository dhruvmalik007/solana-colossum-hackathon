import { listOrdersByMarket, listTradesByMarket } from "@repo/database";

function aggregateLevels(orders: { price: number; remaining: number }[]) {
  const map = new Map<number, number>();
  for (const o of orders) map.set(o.price, (map.get(o.price) ?? 0) + Math.max(0, o.remaining));
  return Array.from(map.entries()).map(([price, size]) => ({ price, size })).filter((l) => l.size > 0);
}

async function buildSnapshot(slug: string) {
  const [orders, trades] = await Promise.all([listOrdersByMarket(slug), listTradesByMarket(slug)]);
  const bids = aggregateLevels(orders.filter((o) => o.side === "Buy")).sort((a, b) => b.price - a.price).slice(0, 16);
  const asks = aggregateLevels(orders.filter((o) => o.side === "Sell")).sort((a, b) => a.price - b.price).slice(0, 16);
  const recentTrades = trades.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)).slice(0, 20).map((t) => ({ side: t.side === "Buy" ? "buy" : "sell", price: t.price, size: t.size, ts: Date.parse(t.createdAt) }));
  return { bids, asks, recentTrades };
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (obj: any) => {
        controller.enqueue(encoder.encode(`event: message\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      const snapshot = await buildSnapshot(slug).catch(() => ({ bids: [], asks: [], recentTrades: [] }));
      enqueue({ type: "snapshot", data: snapshot });
      const interval = setInterval(async () => {
        try { enqueue({ type: "update", data: await buildSnapshot(slug) }); } catch {}
      }, 1500);
      const close = () => { clearInterval(interval); controller.close(); };
      // @ts-ignore
      _req.signal?.addEventListener?.("abort", close);
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "Access-Control-Allow-Origin": process.env.WEB_ORIGIN || "*" } });
}
