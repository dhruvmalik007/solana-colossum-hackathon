import { NextRequest, NextResponse } from "next/server";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  return res;
}

export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

// Minimal trade stub: echoes back inputs and pretends to build a tx template.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const marketId = String(body?.marketId || body?.slug || "");
    const side = (body?.side === "Sell" ? "Sell" : "Buy") as "Buy" | "Sell";
    const size = Math.max(0, Number(body?.size || 0));
    if (!marketId) return withCors(NextResponse.json({ error: "marketId required" }, { status: 400 }));
    if (!Number.isFinite(size) || size <= 0) return withCors(NextResponse.json({ error: "size must be > 0" }, { status: 400 }));

    // TODO Phase 2: construct Anchor transaction calling trade_pmamm with accounts + ix data.
    // For MVP, respond with a pseudo tx template and success note.
    const txTemplate = {
      programId: process.env.SOLANA_PROGRAM_ID || "",
      ix: "trade_pmamm",
      accounts: { /* filled in future */ },
      args: { marketId, side, size },
    };

    return withCors(NextResponse.json({
      ok: true,
      data: { marketId, side, size, txTemplate },
      note: "Trade stub; Phase 2 will return an unsigned transaction for wallet to sign.",
    }));
  } catch (e: any) {
    return withCors(NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 }));
  }
}
