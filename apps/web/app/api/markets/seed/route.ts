import { NextRequest, NextResponse } from "next/server";
import { getMarketBySlug, putMarket, type Market } from "@repo/database";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 64);
}

function endOfMonthISO(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
}

function yyyymm(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function fetchTVLHistory() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/protocol/defillama?path=${encodeURIComponent('/v2/historicalChainTvl/Solana')}`, { next: { revalidate: 0 } });
  if (!r.ok) throw new Error(`defillama tvl ${r.status}`);
  const body = await r.json();
  return (body?.data ?? []) as Array<{ date: number; totalLiquidityUSD: number }>;
}

export async function POST(_req: NextRequest) {
  try {
    const created: Market[] = [];

    // Pull recent TVL to set a reasonable description/range (kept simple for MVP)
    const tvl = await fetchTVLHistory();
    const last = tvl[tvl.length - 1]?.totalLiquidityUSD || 0;

    // Create EOM TVL markets for the next two months
    const base = new Date();
    for (let i = 0; i < 2; i++) {
      const dt = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const ym = yyyymm(dt);
      const title = `What will Solana TVL be at end of ${ym}?`;
      const slug = slugify(`solana-tvl-eom-${ym}`);
      const exists = await getMarketBySlug(slug);
      if (exists) continue;
      const market: Market = {
        id: slug,
        slug,
        title,
        description: `Resolved using DeFiLlama Solana chain TVL EOM snapshot. Last observed: $${Math.round(last).toLocaleString()}.`,
        category: "Solana",
        createdAt: new Date().toISOString(),
        resolutionTime: endOfMonthISO(dt),
        status: "Active",
      };
      await putMarket(market);
      created.push(market);
    }

    return NextResponse.json({ data: created });
  } catch (e) {
    console.error("/api/markets/seed POST error", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
