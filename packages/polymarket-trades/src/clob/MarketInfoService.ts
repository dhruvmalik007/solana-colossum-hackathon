import axios from "axios";
import { MarketInfo, PolymarketConfig } from "../types";

/**
 * MarketInfoService
 *
 * Resolves Polymarket market metadata necessary to build valid orders.
 * Prefers the Gamma Markets API; falls back to defaults from config if unavailable.
 */
export class MarketInfoService {
  private readonly apiBase: string;
  private readonly tickSizeFallback?: number;

  /**
   * Initialize with PolymarketConfig.
   */
  constructor(cfg: PolymarketConfig) {
    this.apiBase = cfg.marketsApiBase || "https://gamma-api.polymarket.com";
    this.tickSizeFallback = cfg.tickSizeFallback;
  }

  /**
   * Convert a numeric tick into the union supported by clob-client ("0.1" | "0.01" | "0.001" | "0.0001").
   */
  private toTickString(n?: number): "0.1" | "0.01" | "0.001" | "0.0001" | undefined {
    if (!n) return undefined;
    const fixed = Number(n).toFixed(4);
    if (fixed === "0.1000") return "0.1";
    if (fixed === "0.0100") return "0.01";
    if (fixed === "0.0010") return "0.001";
    if (fixed === "0.0001") return "0.0001";
    return undefined;
  }

  /**
   * Attempt to extract market info from a Gamma Markets entry.
   */
  private extractFromEntry(entry: Record<string, unknown>, tokenIdHint?: string): MarketInfo | undefined {
    const tokenId = tokenIdHint || String(entry["id"] || entry["assetId"] || "");
    const tickNum = Number(entry["orderPriceMinTickSize"] || entry["tick_size"] || 0);
    const negRisk = Boolean(entry["negRisk"] || entry["neg_risk"] || false);

    const tickSize = Number(this.toTickString(tickNum) || this.tickSizeFallback || 0.001);
    if (!tokenId) return undefined;
    return { tokenId, tickSize, negRisk };
  }

  /**
   * Fetch markets and try to resolve MarketInfo by token id or market id.
   */
  async getMarketInfo(marketIdOrToken: string): Promise<MarketInfo> {
    try {
      const url = `${this.apiBase}/markets`;
      const { data } = await axios.get(url);
      if (Array.isArray(data)) {
        // Try exact token id match via clobTokenIds, else fall back to id match
        for (const entry of data as Array<Record<string, unknown>>) {
          const clobTokenIds = String(entry["clobTokenIds"] || "");
          if (clobTokenIds && clobTokenIds.includes(marketIdOrToken)) {
            const mi = this.extractFromEntry(entry, marketIdOrToken);
            if (mi) return mi;
          }
        }
        const byId = (data as Array<Record<string, unknown>>).find((e) => String(e["id"]) === marketIdOrToken);
        if (byId) {
          const mi = this.extractFromEntry(byId);
          if (mi) return mi;
        }
      }
    } catch {
      // ignore and fall through to fallback
    }
    // Fallback: construct from hint and default tick
    const fallbackTick = Number(this.tickSizeFallback || 0.001);
    return { tokenId: marketIdOrToken, tickSize: fallbackTick, negRisk: false };
  }
}
