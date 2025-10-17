import { NextResponse } from "next/server";
import { putMarket, putOrder, putTrade, type Market, type Order, type Trade } from "@repo/database";

function nowISO() { return new Date().toISOString(); }

async function seedMarket(title: string, category: string | undefined, orders: Array<{ side: "Buy"|"Sell"; price: number; size: number }>, trades: Array<{ side: "Buy"|"Sell"; price: number; size: number }> ) {
  const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 64);
  const market: Market = {
    id: slug,
    slug,
    title,
    description: "Seeded market",
    category,
    createdAt: nowISO(),
    resolutionTime: undefined,
    status: "Active",
  };
  await putMarket(market);

  for (const o of orders) {
    const order: Order = {
      id: `${slug}:${o.side}:${o.price}:${Math.random().toString(36).slice(2,8)}`,
      marketId: slug,
      side: o.side,
      price: o.price,
      size: o.size,
      remaining: o.size,
      status: "Open",
      createdAt: nowISO(),
    };
    await putOrder(order);
  }

  for (const t of trades) {
    const trade: Trade = {
      id: `${slug}:T:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,
      marketId: slug,
      positionId: `${slug}:P:${Math.random().toString(36).slice(2,8)}`,
      side: t.side,
      size: t.size,
      avgPrice: t.price,
      feesPaid: 0,
      createdAt: nowISO(),
    };
    await putTrade(trade);
  }

  return market;
}

export async function GET() {
  const created: Market[] = [];

  // Seed BTC price market
  created.push(await seedMarket(
    "What will the BTC price be on Dec 31, 2025?",
    "Crypto",
    [
      { side: "Buy", price: 95000, size: 500 },
      { side: "Buy", price: 96000, size: 600 },
      { side: "Buy", price: 97000, size: 700 },
      { side: "Sell", price: 105000, size: 500 },
      { side: "Sell", price: 106000, size: 600 },
      { side: "Sell", price: 107000, size: 700 },
    ],
    [
      { side: "Buy", price: 100000, size: 200 },
      { side: "Sell", price: 101000, size: 150 },
    ]
  ));

  // Seed Solana TVL market
  created.push(await seedMarket(
    "What will Solana chain TVL be on Dec 31, 2025?",
    "DeFi",
    [
      { side: "Buy", price: 25_000_000_000, size: 1000 },
      { side: "Buy", price: 30_000_000_000, size: 800 },
      { side: "Sell", price: 35_000_000_000, size: 900 },
      { side: "Sell", price: 40_000_000_000, size: 700 },
    ],
    [
      { side: "Buy", price: 32_000_000_000, size: 200 },
    ]
  ));

  return NextResponse.json({ data: created });
}
