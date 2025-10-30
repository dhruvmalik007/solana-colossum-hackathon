/**
 * Vercel Blob URL helpers for reading public JSON snapshots produced by the indexer.
 */

/**
 * Get the public Blob base URL from env.
 * Example: https://<store-id>.public.blob.vercel-storage.com
 */
export function getBlobPublicBase(): string {
  const base = process.env.BLOB_PUBLIC_BASE_URL;
  if (!base) throw new Error("BLOB_PUBLIC_BASE_URL is not set");
  return base.replace(/\/$/, "");
}

/**
 * Get the blob prefix used when writing snapshots.
 * Defaults to "oracles/solana".
 */
export function getBlobPrefix(): string {
  return (process.env.BLOB_PREFIX ?? "oracles/solana").replace(/^\/+|\/+$/g, "");
}

/**
 * Build a full public Blob URL from a relative path inside the store.
 * @param relativePath Path like "oracles/solana/defillama/protocols/top/latest.json"
 */
export function buildBlobUrl(relativePath: string): string {
  const base = getBlobPublicBase();
  const rel = relativePath.replace(/^\/+/, "");
  return `${base}/${rel}`;
}

/**
 * Fetch a JSON document from the Blob store by relative path.
 * @param relativePath Path inside the store (no leading slash)
 */
export async function fetchBlobJson<T>(relativePath: string): Promise<T> {
  const url = buildBlobUrl(relativePath);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Blob fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}
