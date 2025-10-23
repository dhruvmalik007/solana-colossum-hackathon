import { NextRequest, NextResponse } from "next/server";

const ALLOWLIST = new Set(["/v2/historicalChainTvl/Solana","/overview/fees","/summary/dexs/Solana","/stablecoins/chain/solana"]);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathParam = url.searchParams.get("path") || "";
    if (!pathParam) return NextResponse.json({ error: "path not allowed" }, { status: 400 });
    const normalized = pathParam.split("?")[0];
    if (!ALLOWLIST.has(normalized)) return NextResponse.json({ error: "path not allowed" }, { status: 400 });
    const p = pathParam.startsWith("/") ? pathParam : `/${pathParam}`;
    const target = `https://api.llama.fi${p}`;
    const r = await fetch(target, { cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json({ data, status: r.status });
  } catch {
    return NextResponse.json({ error: "proxy failed" }, { status: 500 });
  }
}
