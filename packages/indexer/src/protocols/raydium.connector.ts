import { Connection } from "@solana/web3.js";
import { endpoints } from "../config";
import type { DexConnector, FetchOptions, PoolSummary, PriceQuote } from "../types";

export class RaydiumConnector implements DexConnector {
  id = "raydium" as const;
  kind = "dex" as const;
  private connection!: Connection;
  async init(connection: Connection): Promise<void> {
    this.connection = connection;
  }
  async getPools(_opts?: FetchOptions): Promise<PoolSummary[]> {
    return [];
  }
  async getQuote(inputMint: string, outputMint: string, amount: string | number, opts?: { slippageBps?: number; txVersion?: "LEGACY" | "V0" }): Promise<PriceQuote> {
    const host = endpoints.raydium.swapHost;
    const url = new URL(host + "/compute/swap-base-in");
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", String(amount));
    if (opts?.slippageBps != null) url.searchParams.set("slippageBps", String(opts.slippageBps));
    url.searchParams.set("txVersion", opts?.txVersion ?? "V0");
    const res = await fetch(url.toString());
    const raw = await res.json();
    const out: PriceQuote = { inMint: inputMint, outMint: outputMint, inAmount: String(amount), slippageBps: opts?.slippageBps, raw };
    return out;
  }
}
