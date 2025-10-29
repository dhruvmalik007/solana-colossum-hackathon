const DEFILLAMA_PROTOCOLS_URL = "https://api.llama.fi/protocols";
const DEFILLAMA_PROTOCOL_URL = (slug: string) => `https://api.llama.fi/protocol/${slug}`;
export type ProtocolSlim = {
  slug: string;
  name: string;
  category: string;
  chains: string[];
  tvl: number;
  change_1d?: number;
  logo?: string;
};

export type ProtocolDetailSlim = {
  slug: string;
  name: string;
  category?: string;
  logo?: string;
  solTvl: { date: number; totalLiquidityUSD: number }[];
};

export async function listSolanaProtocols(): Promise<ProtocolSlim[]> {
  const res = await fetch(DEFILLAMA_PROTOCOLS_URL);
  if (!res.ok) return [];
  const data = (await res.json()) as any[];
  const out: ProtocolSlim[] = data
    .filter((p) => Array.isArray(p?.chains) && p.chains.includes("Solana") && p.category !== "CEX")
    .map((p) => ({
      slug: String(p.slug),
      name: String(p.name),
      category: String(p.category),
      chains: p.chains,
      tvl: Number(p.tvl ?? 0),
      change_1d: typeof p.change_1d === "number" ? p.change_1d : undefined,
      logo: typeof p.logo === "string" ? p.logo : undefined,
    }))
    .sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
  return out;
}

export async function getProtocolDetailSlim(slug: string): Promise<ProtocolDetailSlim | null> {
  const res = await fetch(DEFILLAMA_PROTOCOL_URL(slug));
  if (!res.ok) return null;
  const p: any = await res.json();
  const sol: { date: number; totalLiquidityUSD: number }[] = Array.isArray(p?.chainTvls?.Solana?.tvl)
    ? p.chainTvls.Solana.tvl
    : [];
  const trimmed = Array.isArray(sol) ? sol.slice(-365) : [];
  return {
    slug: String((p as any)?.slug ?? slug),
    name: String((p as any)?.name ?? slug),
    category: typeof (p as any)?.category === "string" ? (p as any).category : undefined,
    logo: typeof (p as any)?.logo === "string" ? (p as any).logo : undefined,
    solTvl: trimmed,
  };
}
