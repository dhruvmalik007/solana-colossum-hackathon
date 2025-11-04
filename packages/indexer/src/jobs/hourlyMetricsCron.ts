import { Connection, Commitment } from "@solana/web3.js";
import { uploadJsonWithLatest, type Snapshot } from "../blob";
import { listSolanaProtocols, getProtocolDetailSlim, type ProtocolSlim, type ProtocolDetailSlim } from "../providers/defillama";
import { createConnector, initConnector } from "../protocols/registry";
import type { DexConnector, ProtocolId, PoolSummary, ProtocolConnector } from "../types";

/**
 * Options for the hourly metrics cron.
 */
export type HourlyMetricsCronOptions = {
  prefix?: string;
  intervalMs?: number;
  token?: string;
  rpcUrl: string;
  wsUrl?: string;
  commitment?: Commitment;
  topN?: number;
};

/**
 * Aggregated DEX summary numbers.
 */
export type DexSummary = {
  poolCount: number;
  totalTvlUsd: number;
};

/**
 * Combined snapshot payload for hourly metrics.
 */
export type HourlyMetricsPayload = {
  dex: {
    summary: DexSummary;
    byProtocol: Record<string, DexSummary>;
  };
  defillama: {
    top: ProtocolSlim[];
    detail: Record<string, ProtocolDetailSlim>;
  };
};

/**
 * Collect granular connector data (DEX pools) and DefiLlama TVL, then persist a coherent hourly snapshot to Vercel Blob.
 * - Writes timestamped JSON and updates latest.json under `${prefix}/metrics/hourly`.
 * - Emits console logs for observability from the backend process.
 */
export async function runHourlyMetricsOnce(opts: HourlyMetricsCronOptions): Promise<void> {
  const prefix = (opts.prefix ?? process.env.BLOB_PREFIX ?? "oracles/solana").replace(/\/$/, "");
  const intervalMs = opts.intervalMs ?? 3_600_000;
  const token = opts.token ?? process.env.BLOB_READ_WRITE_TOKEN;
  const commitment: Commitment = opts.commitment ?? "confirmed";
  const topN = Math.max(1, Math.min(200, opts.topN ?? 50));

  // 1) Build a Connection for connectors that need on-chain access
  const connection = new Connection(opts.rpcUrl, { wsEndpoint: opts.wsUrl, commitment });

  // 2) Collect DEX pools from registered connectors that implement getPools
  const dexIds: ProtocolId[] = ["meteora", "raydium", "jupiter"]; // extend as connectors add pool support
  const byProtocol: Record<string, DexSummary> = {};
  let totalPools = 0;
  let totalTvlUsd = 0;

  for (const id of dexIds) {
    const c = createConnector(id) as ProtocolConnector | null;
    if (!c) continue;
    await initConnector(c, connection);
    if (typeof (c as DexConnector).getPools !== "function") continue;
    const pools: PoolSummary[] = await (c as DexConnector).getPools({});
    const tvlSum = pools.reduce((acc, p) => acc + (p.tvlUsd ?? 0), 0);
    byProtocol[id] = { poolCount: pools.length, totalTvlUsd: tvlSum };
    totalPools += pools.length;
    totalTvlUsd += tvlSum;
    console.log(`[metrics] ${id} pools=${pools.length} tvlUsd=${tvlSum.toFixed(2)}`);
  }

  const dex = {
    summary: { poolCount: totalPools, totalTvlUsd },
    byProtocol,
  };

  // 3) DefiLlama: top protocols + detail for topN (Solana chain)
  const protocols = await listSolanaProtocols();
  const top = protocols.slice(0, topN);
  const detail: Record<string, ProtocolDetailSlim> = {};
  for (const p of top) {
    const d = await getProtocolDetailSlim(p.slug);
    if (d) detail[p.slug] = d;
  }

  const defillama = { top, detail };

  // 4) Persist coherent hourly snapshot
  const updatedAt = new Date().toISOString();
  const snapshot: Snapshot<HourlyMetricsPayload> = {
    provider: "indexer",
    schemaVersion: "v1",
    updatedAt,
    data: { dex, defillama },
  };

  const basePath = `${prefix}/metrics/hourly`;
  const res = await uploadJsonWithLatest(basePath, snapshot, { token });
  console.log(`[metrics] uploaded: ${res.timestamped.pathname} and ${res.latest.pathname}`);
}

/**
 * Start a cron that collects and persists metrics every interval.
 */
export function startHourlyMetricsCron(opts: HourlyMetricsCronOptions): NodeJS.Timer {
  void runHourlyMetricsOnce(opts).catch((e) => console.error("[metrics] runOnce error", e));
  const timer = setInterval(() => {
    void runHourlyMetricsOnce(opts).catch((e) => console.error("[metrics] runOnce error", e));
  }, opts.intervalMs ?? 3_600_000);
  return timer;
}
