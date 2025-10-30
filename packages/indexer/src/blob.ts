import { put } from "@vercel/blob";

/**
 * Result returned by Vercel Blob `put()` for JSON uploads.
 */
export type BlobUploadResult = {
  pathname: string;
  contentType: string;
  contentDisposition: string;
  url: string;
  downloadUrl: string;
};

/**
 * Metadata included with every snapshot we persist to Blob.
 */
export type SnapshotMeta = {
  provider: "defillama" | "protocol" | "indexer";
  schemaVersion: string;
  updatedAt: string; // ISO string
};

/**
 * Standardized snapshot envelope for structured payloads.
 */
export type Snapshot<T> = SnapshotMeta & {
  data: T;
};

/**
 * Upload JSON payload to Vercel Blob at an exact pathname.
 * - Content-Type is set to `application/json; charset=utf-8`.
 * - Overwrite is enabled to allow stable pointer updates.
 * - Uses BLOB_READ_WRITE_TOKEN automatically when deployed on Vercel.
 *
 * @param pathname Absolute path within the blob store (e.g. "oracles/solana/.../latest.json").
 * @param payload Arbitrary JSON-serializable value to persist.
 * @param opts Optional token and cache control options.
 * @returns Upload result including URLs.
 */
export async function uploadJson(
  pathname: string,
  payload: unknown,
  opts?: { token?: string; cacheControlMaxAge?: number }
): Promise<BlobUploadResult> {
  const body = Buffer.from(JSON.stringify(payload));
  const res = await put(pathname, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    token: opts?.token,
    cacheControlMaxAge: opts?.cacheControlMaxAge,
  });
  return res as BlobUploadResult;
}

/**
 * Upload JSON snapshot to a timestamped path and update the sibling `latest.json`.
 * Example `basePath`: "oracles/solana/defillama/protocols/top" produces:
 * - `oracles/solana/defillama/protocols/top/2025-10-30T11-35-22Z.json`
 * - `oracles/solana/defillama/protocols/top/latest.json`
 *
 * @param basePath Base folder where timestamped and latest files are written.
 * @param snapshot Snapshot envelope with metadata and data.
 * @param opts Optional token and cache control options.
 * @returns Both timestamped and latest upload results.
 */
export async function uploadJsonWithLatest<T>(
  basePath: string,
  snapshot: Snapshot<T>,
  opts?: { token?: string; cacheControlMaxAge?: number }
): Promise<{ timestamped: BlobUploadResult; latest: BlobUploadResult }> {
  const iso = snapshot.updatedAt;
  const safeIso = iso.replaceAll(":", "-");
  const timestampedPath = `${basePath}/${safeIso}.json`;
  const latestPath = `${basePath}/latest.json`;

  const timestamped = await uploadJson(timestampedPath, snapshot, opts);
  const latest = await uploadJson(latestPath, snapshot, opts);
  return { timestamped, latest };
}
