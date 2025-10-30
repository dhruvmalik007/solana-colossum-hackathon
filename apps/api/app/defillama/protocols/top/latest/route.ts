import { NextResponse } from "next/server";
import { fetchBlobJson, getBlobPrefix } from "../../../../../lib/vercelBlob";

export type ProtocolSlim = {
  slug: string;
  name: string;
  category: string;
  chains: string[];
  tvl: number;
  change_1d?: number;
  logo?: string;
};

export type SnapshotMeta = {
  provider: "defillama";
  schemaVersion: string;
  updatedAt: string;
};

export type SnapshotTopProtocols = SnapshotMeta & {
  data: { protocols: ProtocolSlim[] };
};

/**
 * GET the latest top protocols snapshot from Vercel Blob.
 * Path in Blob: `${BLOB_PREFIX}/defillama/protocols/top/latest.json`
 */
export async function GET(): Promise<Response> {
  try {
    const prefix = getBlobPrefix();
    const rel = `${prefix}/defillama/protocols/top/latest.json`;
    const json = await fetchBlobJson<SnapshotTopProtocols>(rel);
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
