import { NextResponse } from "next/server";
import { runDefiLlamaOnce } from "@repo/indexer/src/jobs/defillamaCron";

/**
 * Trigger a single DefiLlama snapshot run.
 * Persists JSON snapshots into Vercel Blob under `${BLOB_PREFIX}/defillama/...`.
 *
 * Env:
 * - BLOB_PREFIX (optional, default: "oracles/solana")
 * - BLOB_READ_WRITE_TOKEN (optional override, typically injected by Vercel)
 */
export async function GET(): Promise<Response> {
  try {
    await runDefiLlamaOnce({
      prefix: process.env.BLOB_PREFIX,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
