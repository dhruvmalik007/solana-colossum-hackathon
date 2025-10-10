import 'server-only';

import { withFileCache } from "../server/cache";

const DAY_MS = 24 * 60 * 60 * 1000;

// Types aligned with pages' needs
export type ProtocolSlim = {
  slug: string;
  name: string;
  category: string;
  chains: string[];
  tvl: number;
  change_1d?: number;
  logo?: string;
};

export async function getSolanaProtocolsCached(): Promise<ProtocolSlim[]> {
  console.log("[getSolanaProtocolsCached] called");
  return withFileCache<ProtocolSlim[]>(
    "protocols-solana.v2.min.json",
    DAY_MS,
    async () => {
      const fallback = (): ProtocolSlim[] => [
        { slug: "jupiter", name: "Jupiter", category: "Dex Aggregator", chains: ["Solana"], tvl: 0, change_1d: 0, logo: "https://icons.llama.fi/jupiter.png" },
        { slug: "raydium", name: "Raydium", category: "Dexes", chains: ["Solana"], tvl: 0, change_1d: 0, logo: "https://icons.llama.fi/raydium.png" },
        { slug: "orca", name: "Orca", category: "Dexes", chains: ["Solana"], tvl: 0, change_1d: 0, logo: "https://icons.llama.fi/orca.png" },
        { slug: "meteora", name: "Meteora", category: "Yield", chains: ["Solana"], tvl: 0, change_1d: 0, logo: "https://icons.llama.fi/meteora.png" },
        { slug: "marginfi", name: "marginfi", category: "Lending", chains: ["Solana"], tvl: 0, change_1d: 0, logo: "https://icons.llama.fi/marginfi.png" },
        { slug: "kamino", name: "Kamino", category: "Lending", chains: ["Solana"], tvl: 0, change_1d: 0, logo: "https://icons.llama.fi/kamino.png" },
        { slug: "jito", name: "Jito", category: "Liquid Staking", chains: ["Solana"], tvl: 0, change_1d: 0, logo: "https://icons.llama.fi/jito.png" },
        { slug: "marinade", name: "Marinade", category: "Liquid Staking", chains: ["Solana"], tvl: 0, change_1d: 0, logo: "https://icons.llama.fi/marinade.png" },
      ];

      try {
        console.log("[getSolanaProtocolsCached] cache miss, fetching from DefiLlama");
        const res = await fetch("https://api.llama.fi/protocols", { next: { revalidate: 0 } });
        if (!res.ok) throw new Error(`DefiLlama fetch failed: ${res.status}`);

        const data = (await res.json()) as any[];
        console.log("[getSolanaProtocolsCached] fetched", data?.length ?? 0, "protocols");
        // Trim early to keep cache file small
        const trimmed: ProtocolSlim[] = data
          .filter((p) => Array.isArray(p?.chains) && p.chains.includes("Solana") && p.category !== "CEX")
          .map((p) => ({
            slug: p.slug,
            name: p.name,
            category: p.category,
            chains: p.chains,
            tvl: Number(p.tvl ?? 0),
            change_1d: typeof p.change_1d === 'number' ? p.change_1d : undefined,
            logo: typeof p.logo === 'string' ? p.logo : undefined,
          }))
          .sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
        console.log("[getSolanaProtocolsCached] trimmed to", trimmed.length, "Solana protocols");
        return trimmed.length ? trimmed : fallback();
      } catch (e) {
        console.warn("[getSolanaProtocolsCached] using fallback due to error:", (e as any)?.message ?? e);
        return fallback();
      }
    }
  );
}

export type ProtocolDetailSlim = {
  slug: string;
  name: string;
  category?: string;
  logo?: string;
  solTvl: { date: number; totalLiquidityUSD: number }[];
};

export async function getProtocolDetailSlimCached(slug: string): Promise<ProtocolDetailSlim | null> {
  return withFileCache<ProtocolDetailSlim | null>(
    `protocol-${slug}.min.json`,
    DAY_MS,
    async () => {
      const res = await fetch(`https://api.llama.fi/protocol/${slug}`, { next: { revalidate: 0 } });
      if (!res.ok) return null;
      const p = await res.json();
      const sol: { date: number; totalLiquidityUSD: number }[] = p?.chainTvls?.Solana?.tvl ?? [];
      // Keep only latest 365 points to stay well under size limits
      const trimmedSeries = Array.isArray(sol) ? sol.slice(-365) : [];
      const out: ProtocolDetailSlim = {
        slug: String(p.slug ?? slug),
        name: String(p.name ?? slug),
        category: typeof p.category === 'string' ? p.category : undefined,
        logo: typeof p.logo === 'string' ? p.logo : undefined,
        solTvl: trimmedSeries,
      };
      return out;
    }
  );
}
