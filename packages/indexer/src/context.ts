import { listSolanaProtocols, getProtocolDetailSlim, type ProtocolSlim, type ProtocolDetailSlim } from "./providers/defillama";

export async function topSolanaProtocolsContext(limit = 10) {
  const list = await listSolanaProtocols();
  const top = list.slice(0, limit);
  const parts: string[] = [];
  for (const p of top) {
    parts.push(`${p.name} (${p.category}) tvl=$${Math.round(p.tvl).toLocaleString()} change_1d=${p.change_1d ?? 0}%`);
  }
  return `Top Solana protocols by TVL:\n` + parts.join("\n");
}

export async function protocolTvlHistoryContext(slug: string, days = 90) {
  const detail = await getProtocolDetailSlim(slug);
  if (!detail) return `Protocol ${slug} not found`;
  const series = detail.solTvl.slice(-days);
  const rows = series.map((p) => `${new Date(p.date * 1000).toISOString().slice(0, 10)},$${Math.round(p.totalLiquidityUSD)}`);
  return `TVL history for ${detail.name} (${slug}) last ${series.length} days:\n` + rows.join("\n");
}

export type MarketContextInput = { marketId: string; includeTopProtocols?: number; protocolSlug?: string };

export async function buildMarketContextSnapshot(input: MarketContextInput) {
  const segs: string[] = [`marketId=${input.marketId}`];
  if (input.includeTopProtocols) 
    segs.push(await topSolanaProtocolsContext(input.includeTopProtocols));
  if (input.protocolSlug) 
    segs.push(await protocolTvlHistoryContext(input.protocolSlug));
  
  return segs.join("\n\n");
}
