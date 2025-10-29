import { NextResponse } from "next/server";
import type { DefiLlamaProtocol, ProtocolTrimmed } from "../types-file";
import { toProtocolTrimmed } from "../types-file";
import { DEFILLAMA_PROTOCOLS_URL } from "../../../web/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(DEFILLAMA_PROTOCOLS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`defillama ${res.status}`);
    const data: DefiLlamaProtocol[] = await res.json();
    const trimmed: ProtocolTrimmed[] = data
      .filter((p) => Array.isArray(p?.chains) && p.chains.includes("Solana") && p.category !== "CEX")
      .map((p) => toProtocolTrimmed(p))
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
    const out = NextResponse.json(trimmed);
    out.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
    return out;
  } catch (e: any) {
    const out = NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
    out.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
    return out;
  }
}
