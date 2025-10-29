// Type definitions for DeFiLlama protocols API
// Source shape summarized from https://api.llama.fi/protocols and public docs

export type DefiLlamaProtocol = {
  // core identifiers
  id?: string | number;
  name: string;
  slug: string;
  symbol?: string;

  // categorization
  category?: string;
  chains: string[];

  // metrics
  tvl: number;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  mcap?: number;
  chainTvls?: Record<string, unknown>;

  // links/media (may be present on single-protocol endpoints; sometimes included here)
  logo?: string;
  url?: string;
  twitter?: string;
};

// The trimmed shape returned by our API
export type ProtocolTrimmed = {
  slug: string;
  name: string;
  category?: string;
  chains: string[];
  tvl: number;
  change_1d?: number;
  logo?: string;
};

export function toProtocolTrimmed(p: DefiLlamaProtocol): ProtocolTrimmed {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    chains: Array.isArray(p.chains) ? p.chains : [],
    tvl: typeof p.tvl === 'number' ? p.tvl : 0,
    change_1d: typeof p.change_1d === 'number' ? p.change_1d : undefined,
    logo: typeof p.logo === 'string' ? p.logo : undefined,
  };
}
