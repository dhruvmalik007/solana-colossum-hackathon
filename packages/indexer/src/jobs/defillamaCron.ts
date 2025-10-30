import { uploadJsonWithLatest, type Snapshot } from "../blob";
import { listSolanaProtocols, getProtocolDetailSlim, type ProtocolSlim, type ProtocolDetailSlim } from "../providers/defillama";

export type DefiLlamaCronOptions = {
  prefix?: string; // e.g. "oracles/solana"
  intervalMs?: number; // default 5 minutes
  topN?: number; // default 50
  detailsConcurrency?: number; // default 5
  token?: string; // BLOB token override
};

/**
 * Start a periodic job that fetches DefiLlama data and writes snapshots to Vercel Blob.
 * - Uploads a top protocols list snapshot (Solana only)
 * - Uploads detail TVL snapshots per top N protocols
 */
/**
 * Run the DefiLlama snapshot pipeline once.
 */
export async function runDefiLlamaOnce(opts?: DefiLlamaCronOptions): Promise<void> {
  const prefix = (opts?.prefix ?? process.env.BLOB_PREFIX ?? "oracles/solana").replace(/\/$/, "");
  const intervalMs = opts?.intervalMs ?? Number(process.env.DEFI_LLAMA_CRON_MS || 300_000);
  const topN = opts?.topN ?? 50;
  const detailsConcurrency = Math.max(1, Math.min(20, opts?.detailsConcurrency ?? 5));
  const token = opts?.token;

  const updatedAt = new Date().toISOString();

  // 1) Top protocols list (Solana only)
  const protocols: ProtocolSlim[] = await listSolanaProtocols();
  const top = protocols.slice(0, topN);

  const listSnapshot: Snapshot<{ protocols: ProtocolSlim[] }> = {
    provider: "defillama",
    schemaVersion: "v1",
    updatedAt,
    data: { protocols: top },
  };

  await uploadJsonWithLatest(`${prefix}/defillama/protocols/top`, listSnapshot, { token });

  // 2) Per-protocol details (limited concurrency)
  const queue: ProtocolSlim[] = [...top];
  const workers: Promise<void>[] = [];

  for (let i = 0; i < detailsConcurrency; i++) {
    workers.push(
      (async () => {
        while (queue.length) {
          const item = queue.shift();
          if (!item) break;
          const detail: ProtocolDetailSlim | null = await getProtocolDetailSlim(item.slug);
          if (!detail) continue;
          const detailSnapshot: Snapshot<ProtocolDetailSlim> = {
            provider: "defillama",
            schemaVersion: "v1",
            updatedAt,
            data: detail,
          };
          await uploadJsonWithLatest(`${prefix}/defillama/protocols/${item.slug}`, detailSnapshot, { token });
        }
      })()
    );
  }

  await Promise.all(workers);
}

/**
 * Start a periodic cron that calls the DefiLlama snapshot pipeline on an interval.
 */
export function startDefiLlamaCron(opts?: DefiLlamaCronOptions): NodeJS.Timer {
  const intervalMs = opts?.intervalMs ?? Number(process.env.DEFI_LLAMA_CRON_MS || 300_000);

  // Run immediately, then on interval
  void runDefiLlamaOnce(opts).catch((e) => console.error("[defillamaCron] runOnce error", e));
  const timer = setInterval(() => {
    void runDefiLlamaOnce(opts).catch((e) => console.error("[defillamaCron] runOnce error", e));
  }, intervalMs);

  return timer;
}
