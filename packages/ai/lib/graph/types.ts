/**
 * Graph core types and interfaces for Mem0-compatible graph memory.
 *
 * Provides a storage-agnostic GraphStore interface and strongly-typed
 * node/edge payloads to avoid usage of `any`.
 */

export type Primitive = string | number | boolean | null;

export type Properties = Readonly<Record<string, Primitive>>;

/** Node reference used for addressing nodes in edges and responses. */
export interface GraphNodeRef {
  readonly label: string;
  readonly key: string;
  readonly id?: string | number;
}

/** Edge reference used for read responses. */
export interface GraphEdgeRef {
  readonly type: string;
  readonly id?: string | number;
}

/** Result triple for simple traversal reads. */
export interface GraphTriple {
  readonly source: GraphNodeRef;
  readonly relationship: GraphEdgeRef;
  readonly target: GraphNodeRef;
}

/** Optional filters used to scope read/write operations. */
export interface GraphFilters {
  readonly dataset?: string; // e.g., "indexer", "mem0"
  readonly userId?: string;
  readonly agentId?: string;
  readonly runId?: string;
}

/**
 * Storage-agnostic graph interface.
 * Implementations may use Neptune, Neo4j, or in-memory backends.
 */
export interface GraphStore {
  /** Upserts a labeled node by unique key with the given properties. */
  upsertNode(label: string, key: string, props: Properties, filters?: GraphFilters): Promise<GraphNodeRef>;

  /** Upserts a directed relationship between two existing nodes. */
  upsertEdge(
    from: GraphNodeRef,
    type: string,
    to: GraphNodeRef,
    props?: Properties,
    filters?: GraphFilters
  ): Promise<GraphEdgeRef>;

  /** Executes a parameterized Cypher query. */
  queryCypher<T = unknown>(query: string, params?: Readonly<Record<string, unknown>>): Promise<readonly T[]>;

  /** Returns triples constrained by optional filters. */
  getAllEdges(filters?: GraphFilters, limit?: number): Promise<readonly GraphTriple[]>;

  /** Deletes all nodes and edges that match filters, returns count. */
  deleteAll(filters?: GraphFilters): Promise<number>;
}

/** Domain labels and relationship types used by the ontology. */
export const Labels = {
  Protocol: "Protocol",
  Pool: "Pool",
  Token: "Token",
  Reserve: "Reserve",
  StakePool: "StakePool",
  Chain: "Chain",
  Oracle: "Oracle",
  Market: "Market",
  User: "User",
} as const;

export type Label = typeof Labels[keyof typeof Labels];

export const Rels = {
  HAS_POOL: "HAS_POOL",
  HAS_TOKEN: "HAS_TOKEN",
  HAS_RESERVE: "HAS_RESERVE",
  HAS_STAKEPOOL: "HAS_STAKEPOOL",
  LISTED_ON: "LISTED_ON",
  ORACLE_FEEDS: "ORACLE_FEEDS",
  QUOTES: "QUOTES",
  SUPPORTS_CHAIN: "SUPPORTS_CHAIN",
  OWNS: "OWNS",
} as const;

export type Rel = typeof Rels[keyof typeof Rels];
