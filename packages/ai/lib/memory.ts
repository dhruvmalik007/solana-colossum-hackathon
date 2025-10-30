import MemoryClient from "mem0ai";
import type { GraphStore, GraphFilters, GraphNodeRef, GraphEdgeRef, GraphTriple } from "./graph/types";
import { Neo4jGraphStore } from "./graph/neo4j";

/**
 * Parameters passed alongside memory operations to scope ownership and features.
 */
export type MemoryInit = {
  userId?: string;
  agentId?: string;
  runId?: string;
  enableGraph?: boolean;
  rerank?: boolean;
  graphStore?: GraphStore;
  reranker?: unknown;
  embedder?: unknown;
};

export type MemoryConfig = {
  apiKey: string;
  host?: string;
  organizationName?: string;
  projectName?: string;
  organizationId?: string;
  projectId?: string;
};

export class MemoryManager {
  private static instance: MemoryManager;
  private config: MemoryConfig | null = null;
  private client: MemoryClient | null = null;
  private graph?: GraphStore;

  private static readonly DEFAULT_TIMEOUT_MS = Number(process.env.MEM0_TIMEOUT_MS || 10000);
  private static readonly DEFAULT_RETRIES = Number(process.env.MEM0_RETRIES || 2);
  private static readonly DEFAULT_BACKOFF_MS = Number(process.env.MEM0_BACKOFF_MS || 300);

  private constructor() {}

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private static async withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return await Promise.race([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`mem0 timeout after ${ms}ms`)), ms)),
    ]);
  }

  private static async doWithRetry<T>(fn: () => Promise<T>, retries = MemoryManager.DEFAULT_RETRIES, backoffMs = MemoryManager.DEFAULT_BACKOFF_MS): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (e: unknown) {
        lastErr = e;
        if (i < retries) await MemoryManager.sleep(backoffMs * Math.pow(2, i));
      }
    }
    throw lastErr;
  }

  /**
   * Configure Mem0 client connection (API key and metadata).
   */
  configure(config: MemoryConfig): void {
    this.config = config;
    this.client = null;
  }

  /**
   * Attach a GraphStore implementation (e.g., NeptuneGraphStore) for graph operations.
   */
  setGraphStore(store: GraphStore): void {
    this.graph = store;
  }

  /** Returns the active GraphStore if configured. */
  getGraphStore(): GraphStore | undefined {
    return this.graph;
  }

  loadConfigFromEnv(): MemoryConfig {
    return {
      apiKey: process.env.MEM0_API_KEY || "",
      host: process.env.MEM0_HOST,
      organizationName: process.env.MEM0_ORGANIZATION_NAME,
      projectName: process.env.MEM0_PROJECT_NAME,
      organizationId: process.env.MEM0_ORGANIZATION_ID,
      projectId: process.env.MEM0_PROJECT_ID,
    };
  }

  private async getClient(config?: MemoryConfig): Promise<MemoryClient> {
    if (config) {
      this.configure(config);
    }
    if (this.client) return this.client;
    const cfg = this.config ?? this.loadConfigFromEnv();
    if (!cfg.apiKey) {
      throw new Error("MEM0_API_KEY missing. Configure via configure() or env vars.");
    }
    this.client = new MemoryClient(cfg);
    return this.client;
  }

  /**
   * Add one or more messages to Mem0, with retry and timeout.
   */
  async addMemories(messages: ReadonlyArray<Record<string, unknown> | string>, opts?: Partial<MemoryInit>): Promise<unknown> {
    const client = await this.getClient();
    const payload: ReadonlyArray<Record<string, unknown> | string> = Array.isArray(messages) ? messages : [messages];
    const { userId, agentId, runId, enableGraph } = opts || {};
    if (opts?.graphStore) this.setGraphStore(opts.graphStore);

    type DynamicClient = {
      add?: (p: unknown, o: unknown) => Promise<unknown>;
      addMessages?: (p: unknown, o: unknown) => Promise<unknown>;
      index?: (p: unknown, o: unknown) => Promise<unknown>;
    };
    const dyn = client as unknown as DynamicClient;
    const candidates: ReadonlyArray<keyof DynamicClient> = ["add", "addMessages", "index"] as const;

    for (const name of candidates) {
      const fn = dyn[name];
      if (typeof fn === "function") {
        return await MemoryManager.doWithRetry(
          () => MemoryManager.withTimeout(
            fn.call(client, payload as unknown, { userId, agentId, runId, enableGraph } as unknown),
            MemoryManager.DEFAULT_TIMEOUT_MS
          )
        );
      }
    }
    throw new Error("mem0 client missing add method");
  }

  /**
   * Search memories via Mem0 with optional rerank/filters.
   */
  async searchMemories(query: string, opts?: MemoryInit & { limit?: number; filters?: Record<string, unknown> }): Promise<unknown> {
    const client = await this.getClient();
    try {
      if (opts?.graphStore) this.setGraphStore(opts.graphStore);
      const exec = () => client.search(query, { user_id: opts?.userId, agent_id: opts?.agentId, run_id: opts?.runId, enable_graph: opts?.enableGraph, rerank: opts?.rerank, limit: opts?.limit ?? 5, filters: opts?.filters });
      return await MemoryManager.doWithRetry(() => MemoryManager.withTimeout(exec(), MemoryManager.DEFAULT_TIMEOUT_MS));
    } catch (error: unknown) {
      console.error("Error searching memories:", error);
      throw error;
    }
  }

  /**
   * Configure a Neo4j-backed GraphStore from environment variables.
   *
   * Expected variables:
   * - NEO4J_URI or NEO4J_URL (bolt/neo4j+s connection string)
   * - NEO4J_USERNAME
   * - NEO4J_PASSWORD
   * - NEO4J_DATABASE (optional)
   * - GRAPH_DATASET (optional default dataset tag)
   */
  configureGraphFromEnv(): void {
    const url = process.env.NEO4J_URI || process.env.NEO4J_URL;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;
    if (!url || !username || !password) return;
    const database = process.env.NEO4J_DATABASE || undefined;
    const datasetDefault = process.env.GRAPH_DATASET || undefined;
    const store = new Neo4jGraphStore({ url, username, password, database, datasetDefault });
    this.setGraphStore(store);
  }

  // -------- Graph helpers (backed by configured GraphStore) --------

  /** Upsert a labeled node by key into the configured GraphStore. */
  async graphUpsertNode(label: string, key: string, props: Readonly<Record<string, string | number | boolean | null>>, filters?: GraphFilters): Promise<GraphNodeRef> {
    if (!this.graph) throw new Error("GraphStore is not configured");
    return this.graph.upsertNode(label, key, props, filters);
  }

  /** Upsert a directed edge between two node refs. */
  async graphUpsertEdge(from: GraphNodeRef, type: string, to: GraphNodeRef, props?: Readonly<Record<string, string | number | boolean | null>>, filters?: GraphFilters): Promise<GraphEdgeRef> {
    if (!this.graph) throw new Error("GraphStore is not configured");
    return this.graph.upsertEdge(from, type, to, props, filters);
  }

  /** List triples for verification or traversal. */
  async graphGetAll(filters?: GraphFilters, limit?: number): Promise<readonly GraphTriple[]> {
    if (!this.graph) throw new Error("GraphStore is not configured");
    return this.graph.getAllEdges(filters, limit);
  }

  /** Delete all graph data for a scope. */
  async graphDeleteAll(filters?: GraphFilters): Promise<number> {
    if (!this.graph) throw new Error("GraphStore is not configured");
    return this.graph.deleteAll(filters);
  }
}

// Legacy exports for backward compatibility
export type MemoryInitLegacy = MemoryInit;
export type MemoryConfigLegacy = MemoryConfig;

let currentConfig: MemoryConfig | null = null;
let singletonClient: MemoryClient | null = null;

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

/** Add messages via the singleton MemoryManager. */
export async function addMemories(messages: ReadonlyArray<Record<string, unknown> | string>, opts?: Partial<MemoryInit>) {
  return MemoryManager.getInstance().addMemories(messages, opts);
}

/** Search messages via the singleton MemoryManager. */
export async function searchMemories(query: string, opts?: MemoryInit & { limit?: number; filters?: Record<string, unknown> }) {
  return MemoryManager.getInstance().searchMemories(query, opts);
}

export class MemoryService {
  constructor(private base?: Partial<MemoryInit>) {}
  /** Add messages with preconfigured scope. */
  async addMessages(messages: ReadonlyArray<Record<string, unknown> | string>, opts?: Partial<MemoryInit>) {
    return addMemories(messages, { ...this.base, ...opts });
  }
  /** Search messages with preconfigured scope. */
  async search(query: string, opts?: Partial<MemoryInit> & { limit?: number; filters?: Record<string, unknown> }) {
    return searchMemories(query, { ...this.base, ...opts });
  }
}
