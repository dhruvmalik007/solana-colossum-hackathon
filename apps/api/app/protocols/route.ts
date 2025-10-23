import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("https://api.llama.fi/protocols", { cache: "no-store" });
    if (!res.ok) throw new Error(`defillama ${res.status}`);
    const data = (await res.json()) as any[];
    const trimmed = data
      .filter((p) => Array.isArray(p?.chains) && p.chains.includes("Solana") && p.category !== "CEX")
      .map((p) => ({ slug: p.slug, name: p.name, category: p.category, chains: p.chains, tvl: Number(p.tvl ?? 0), change_1d: typeof p.change_1d === 'number' ? p.change_1d : undefined, logo: typeof p.logo === 'string' ? p.logo : undefined }))
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
