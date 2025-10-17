import { Connection, PublicKey } from "@solana/web3.js";
import { endpoints } from "../config";
import type { DexConnector, FetchOptions, PoolSummary, PriceQuote } from "../types";

export class MeteoraConnector implements DexConnector {
  id = "meteora" as const;
  kind = "dex" as const;
  private connection!: Connection;
  async init(connection: Connection): Promise<void> {
    this.connection = connection;
  }
  async getPools(_opts?: FetchOptions): Promise<PoolSummary[]> {
    const url = endpoints.meteora.dlmmApi + endpoints.meteora.paths.pairsAll;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: any[] = await res.json();
    const out: PoolSummary[] = (Array.isArray(data) ? data : []).map((p: any) => ({
      address: String(p?.lbPair ?? p?.address ?? p?.poolAddress ?? ""),
      baseMint: String(p?.mint_x ?? p?.baseMint ?? p?.tokenX?.mint ?? ""),
      quoteMint: String(p?.mint_y ?? p?.quoteMint ?? p?.tokenY?.mint ?? ""),
      tvlUsd: typeof p?.tvl_usd === "number" ? p.tvl_usd : typeof p?.tvlUSD === "number" ? p.tvlUSD : undefined,
      volume24hUsd: typeof p?.volume_24h_usd === "number" ? p.volume_24h_usd : typeof p?.volume24hUsd === "number" ? p.volume24hUsd : undefined,
      feeBps: typeof p?.fee_bps === "number" ? p.fee_bps : typeof p?.feeBps === "number" ? p.feeBps : undefined,
    }));
    return out;
  }
  async getQuote(inputMint: string, outputMint: string, amount: string | number, _opts?: { slippageBps?: number; txVersion?: "LEGACY" | "V0" }): Promise<PriceQuote> {
    return { inMint: inputMint, outMint: outputMint, inAmount: String(amount) };
  }
}
