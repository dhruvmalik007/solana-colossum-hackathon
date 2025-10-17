import { Connection } from "@solana/web3.js";
import { endpoints } from "../config";
import type { DexConnector, FetchOptions, PoolSummary, PriceQuote } from "../types";

export class JupiterConnector implements DexConnector {
  id = "jupiter" as const;
  kind = "dex" as const;
  private connection!: Connection;
  async init(connection: Connection): Promise<void> {
    this.connection = connection;
  }
  async getPools(_opts?: FetchOptions): Promise<PoolSummary[]> {
    return [];
  }
  async getQuote(inputMint: string, outputMint: string, amount: string | number, opts?: { slippageBps?: number; txVersion?: "LEGACY" | "V0" }): Promise<PriceQuote> {
    const base = endpoints.jupiter.free;
    const url = new URL(base + endpoints.jupiter.paths.swapQuoteV1);
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", String(amount));
    if (opts?.slippageBps != null) url.searchParams.set("slippageBps", String(opts.slippageBps));
    const res = await fetch(url.toString());
    const raw = await res.json();
    const out: PriceQuote = { inMint: inputMint, outMint: outputMint, inAmount: String(amount), slippageBps: opts?.slippageBps, raw };
    return out;
  }
}
