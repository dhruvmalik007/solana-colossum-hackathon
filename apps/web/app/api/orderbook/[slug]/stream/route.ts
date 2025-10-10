import { NextRequest } from "next/server";

function makeBook() {
  const bids = Array.from({ length: 10 }).map((_, i) => ({ price: 100 - i * 0.1, size: Math.floor(500 + Math.random() * 1500) }));
  const asks = Array.from({ length: 10 }).map((_, i) => ({ price: 100 + i * 0.1, size: Math.floor(500 + Math.random() * 1500) }));
  const recentTrades = Array.from({ length: 5 }).map((_, i) => ({
    side: Math.random() > 0.5 ? "buy" : "sell",
    price: 100 + (Math.random() - 0.5) * 1,
    size: Math.floor(50 + Math.random() * 200),
    ts: Date.now() - i * 2000,
  }));
  return { bids, asks, recentTrades };
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      // send initial snapshot
      const payload = JSON.stringify({ type: "snapshot", data: makeBook() });
      controller.enqueue(encoder.encode(`event: message\n`));
      controller.enqueue(encoder.encode(`data: ${payload}\n\n`));

      const interval = setInterval(() => {
        const update = JSON.stringify({ type: "update", data: makeBook() });
        controller.enqueue(encoder.encode(`event: message\n`));
        controller.enqueue(encoder.encode(`data: ${update}\n\n`));
      }, 1500);

      const close = () => {
        clearInterval(interval);
        controller.close();
      };

      // If the client disconnects
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
