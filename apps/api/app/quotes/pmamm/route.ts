import { NextRequest, NextResponse } from "next/server";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  return res;
}

export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

// Minimal pm-AMM quote stub to enable E2E. Replace with invariant solver per specs.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const side = (body?.side === "Sell" ? "Sell" : "Buy") as "Buy" | "Sell";
    const size = Math.max(0, Number(body?.size || 0));
    const marketId = String(body?.marketId || body?.slug || "");
    if (!marketId) return withCors(NextResponse.json({ error: "marketId required" }, { status: 400 }));

    // Placeholder pricing: mid 0.50, tiny slippage proportional to sqrt(size)
    const mid = 0.5;
    const baseSlip = Math.min(0.02, Math.sqrt(size || 0) * 0.0005); // cap at 2%
    const slip = side === "Buy" ? baseSlip : -baseSlip;
    const avgPrice = Math.max(0.0001, Math.min(0.9999, mid + slip));

    const platformBps = Number(process.env.PLATFORM_FEE_BPS || 30);
    const creatorBps = Number(process.env.CREATOR_FEE_BPS || 20);
    const totalBps = platformBps + creatorBps;
    const feeUSD = (size * totalBps) / 10_000;

    return withCors(NextResponse.json({
      data: {
        marketId,
        side,
        size,
        avgPrice,
        slippage: Math.abs(slip),
        feeUSD,
        feeBps: { platformBps, creatorBps },
        note: "pm-AMM quote stub; replace with invariant solver in Phase 2",
      }
    }));
  } catch (e: any) {
    return withCors(NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 }));
  }
}
