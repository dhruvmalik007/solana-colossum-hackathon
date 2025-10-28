import MemoryClient from "mem0ai";
export type MemoryInit = {
  userId?: string;
  agentId?: string;
  runId?: string;
  enableGraph?: boolean;
  rerank?: boolean;
  graphStore?: any;
  reranker?: any;
  embedder?: any;
};

export type MemoryConfig = {
  apiKey: string;
  host?: string;
  organizationName?: string;
  projectName?: string;
  organizationId?: string;
  projectId?: string;
};

let currentConfig: MemoryConfig | null = null;
let singletonClient: MemoryClient | null = null;

const DEFAULT_TIMEOUT_MS = Number(process.env.MEM0_TIMEOUT_MS || 10000);
const DEFAULT_RETRIES = Number(process.env.MEM0_RETRIES || 2);
const DEFAULT_BACKOFF_MS = Number(process.env.MEM0_BACKOFF_MS || 300);

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`mem0 timeout after ${ms}ms`)), ms)),
  ]);
}

async function doWithRetry<T>(fn: () => Promise<T>, retries = DEFAULT_RETRIES, backoffMs = DEFAULT_BACKOFF_MS): Promise<T> {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < retries) await sleep(backoffMs * Math.pow(2, i));
    }
  }
  throw lastErr;
}

export function configureMemory(config: MemoryConfig) {
  currentConfig = config;
  singletonClient = null;
}

export function loadMemoryConfigFromEnv(): MemoryConfig {
  const cfg: MemoryConfig = {
    apiKey: process.env.MEM0_API_KEY || "",
    host: process.env.MEM0_HOST,
    organizationName: process.env.MEM0_ORGANIZATION_NAME,
    projectName: process.env.MEM0_PROJECT_NAME,
    organizationId: process.env.MEM0_ORGANIZATION_ID,
    projectId: process.env.MEM0_PROJECT_ID,
  };
  return cfg;
}

export async function getMemoryClient(config?: MemoryConfig): Promise<MemoryClient> {
  if (config) {
    configureMemory(config);
  }
  if (singletonClient) return singletonClient;
  const cfg = currentConfig ?? loadMemoryConfigFromEnv();
  if (!cfg.apiKey) {
    throw new Error("MEM0_API_KEY missing. Configure via configureMemory() or env vars.");
  }
  singletonClient = new MemoryClient(cfg);
  return singletonClient;
}

export async function addMemories(messages: any[], opts?: Partial<MemoryInit>) {
  const client = await getMemoryClient();
  const payload: any[] = Array.isArray(messages) ? messages : [messages];
  const { userId, agentId, runId, enableGraph } = opts || {};
  const c: any = client as any;
  if (typeof c.add === "function") return doWithRetry(() => withTimeout(c.add(payload, { userId, agentId, runId, enableGraph }), DEFAULT_TIMEOUT_MS));
  if (typeof c.addMessages === "function") return doWithRetry(() => withTimeout(c.addMessages(payload, { userId, agentId, runId, enableGraph }), DEFAULT_TIMEOUT_MS));
  if (typeof c.index === "function") return doWithRetry(() => withTimeout(c.index(payload, { userId, agentId, runId, enableGraph }), DEFAULT_TIMEOUT_MS));
  throw new Error("mem0 client missing add method");
}

export async function searchMemories(query: string, opts?: MemoryInit & { limit?: number; filters?: any }) {
  const client = await getMemoryClient();
  try {
    // fetching from the hosted mem0ai / or from the database
    const exec = () => client.search(query, { user_id: opts?.userId, agent_id: opts?.agentId, run_id: opts?.runId, enable_graph: opts?.enableGraph, rerank: opts?.rerank, limit: opts?.limit ?? 5, filters: opts?.filters });
    return await doWithRetry(() => withTimeout(exec(), DEFAULT_TIMEOUT_MS));
  } catch (error) {
    console.error("Error searching memories:", error);
    throw error;
  }
}

export class MemoryService {
  constructor(private base?: Partial<MemoryInit>) {}
  async addMessages(messages: any[], opts?: Partial<MemoryInit>) {
    return addMemories(messages, { ...this.base, ...opts });
  }
  async search(query: string, opts?: Partial<MemoryInit> & { limit?: number; filters?: any }) {
    return searchMemories(query, { ...this.base, ...opts });
  }
}
