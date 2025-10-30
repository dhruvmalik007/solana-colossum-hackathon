import { NextResponse } from "next/server";
import { fetchBlobJson, getBlobPrefix } from "../../../../../lib/vercelBlob";

export type ProtocolDetailSlim = {
  slug: string;
  name: string;
  category?: string;
  logo?: string;
  solTvl: { date: number; totalLiquidityUSD: number }[];
};

export type SnapshotMeta = {
  provider: "defillama";
  schemaVersion: string;
  updatedAt: string;
};

export type SnapshotProtocolDetail = SnapshotMeta & {
  data: ProtocolDetailSlim;
};

/**
 * GET the per-protocol latest snapshot from Vercel Blob.
 * Path in Blob: `${BLOB_PREFIX}/defillama/protocols/{slug}/latest.json`
 */
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
): Promise<Response> {
  try {
    const prefix = getBlobPrefix();
    const rel = `${prefix}/defillama/protocols/${params.slug}/latest.json`;
    const json = await fetchBlobJson<SnapshotProtocolDetail>(rel);
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
