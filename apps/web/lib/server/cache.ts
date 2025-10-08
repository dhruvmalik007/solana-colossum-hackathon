import { promises as fs } from "node:fs";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), ".cache");

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function cachePath(filename: string) {
  return path.join(CACHE_DIR, filename);
}

async function readJSON<T = any>(filename: string): Promise<T | null> {
  try {
    const file = cachePath(filename);
    const buf = await fs.readFile(file, "utf8");
    return JSON.parse(buf) as T;
  } catch {
    return null;
  }
}

async function writeJSON(filename: string, data: any) {
  await ensureCacheDir();
  const file = cachePath(filename);
  await fs.writeFile(file, JSON.stringify(data), "utf8");
}

async function isFresh(filename: string, ttlMs: number): Promise<boolean> {
  try {
    const stat = await fs.stat(cachePath(filename));
    const age = Date.now() - stat.mtimeMs;
    return age < ttlMs;
  } catch {
    return false;
  }
}

export async function withFileCache<T>(
  filename: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  shrink?: (data: T) => any
): Promise<T> {
  const fresh = await isFresh(filename, ttlMs);
  if (fresh) {
    const cached = await readJSON<T>(filename);
    if (cached) return cached;
  }
  const data = await fetcher();
  const toStore = shrink ? shrink(data) : data;
  await writeJSON(filename, toStore);
  return toStore;
}

export { CACHE_DIR, cachePath, readJSON, writeJSON, isFresh };
