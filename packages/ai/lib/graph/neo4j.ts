import neo4j, { auth, Driver, Session, type Record as Neo4jRecord, type Integer as Neo4jInteger } from "neo4j-driver";
import type {
  GraphEdgeRef,
  GraphFilters,
  GraphNodeRef,
  GraphStore,
  GraphTriple,
  Properties,
} from "./types";

/**
 * Configuration for connecting to a Neo4j database.
 */
export interface Neo4jConfig {
  /** Bolt URI, e.g. neo4j+s://<instance>.databases.neo4j.io or bolt://localhost:7687 */
  readonly url: string;
  /** Username for Neo4j authentication */
  readonly username: string;
  /** Password for Neo4j authentication */
  readonly password: string;
  /** Optional logical database name (defaults to "neo4j") */
  readonly database?: string;
  /** Default dataset tag applied to nodes/edges when not provided */
  readonly datasetDefault?: string;
}

function assertSafeIdent(ident: string): string {
  const ok = /^[A-Za-z_][A-Za-z0-9_]*$/.test(ident);
  if (!ok) throw new Error(`Unsafe identifier: ${ident}`);
  return ident;
}

/**
 * Neo4jGraphStore implements GraphStore backed by Neo4j using the official driver.
 *
 * All write operations are executed in write transactions and attach an optional
 * dataset tag to nodes/edges when provided via GraphFilters or default config.
 */
export class Neo4jGraphStore implements GraphStore {
  private readonly driver: Driver;
  private readonly database: string;
  private readonly datasetDefault?: string;

  /**
   * Create a new Neo4j-backed GraphStore.
   * @param cfg - Connection information and defaults
   */
  constructor(cfg: Neo4jConfig) {
    this.driver = neo4j.driver(cfg.url, auth.basic(cfg.username, cfg.password));
    this.database = cfg.database ?? "neo4j";
    this.datasetDefault = cfg.datasetDefault;
  }

  private async withSession<T>(accessMode: "READ" | "WRITE", fn: (s: Session) => Promise<T>): Promise<T> {
    const session = this.driver.session({ database: this.database, defaultAccessMode: accessMode });
    try {
      return await fn(session);
    } finally {
      await session.close();
    }
  }

  /**
   * Upsert a labeled node identified by a unique key.
   */
  async upsertNode(label: string, key: string, props: Properties, filters?: GraphFilters): Promise<GraphNodeRef> {
    const lbl = assertSafeIdent(label);
    const dataset = filters?.dataset ?? this.datasetDefault ?? null;
    const query = `
      MERGE (n:${lbl} { key: $key })
      SET n += $props
      SET n.dataset = coalesce($dataset, n.dataset)
      RETURN labels(n)[0] AS label, n.key AS key
    `;
    return this.withSession("WRITE", async (s) => {
      const res = await s.run(query, { key, props, dataset });
      const rec = res.records[0];
      const out: GraphNodeRef = {
        label: (rec?.get("label") as string) ?? label,
        key: (rec?.get("key") as string) ?? key,
      };
      return out;
    });
  }

  /**
   * Upsert a directed relationship between two existing nodes.
   */
  async upsertEdge(
    from: GraphNodeRef,
    type: string,
    to: GraphNodeRef,
    props?: Properties,
    filters?: GraphFilters
  ): Promise<GraphEdgeRef> {
    const fromLbl = assertSafeIdent(from.label);
    const toLbl = assertSafeIdent(to.label);
    const relType = assertSafeIdent(type);
    const dataset = filters?.dataset ?? this.datasetDefault ?? null;
    const query = `
      MATCH (a:${fromLbl} { key: $fromKey }), (b:${toLbl} { key: $toKey })
      MERGE (a)-[r:${relType}]->(b)
      SET r += coalesce($props, {})
      SET r.dataset = coalesce($dataset, r.dataset)
      RETURN type(r) AS type
    `;
    return this.withSession("WRITE", async (s) => {
      const res = await s.run(query, { fromKey: from.key, toKey: to.key, props: props ?? {}, dataset });
      const rType = (res.records[0]?.get("type") as string) ?? relType;
      return { type: rType };
    });
  }

  /**
   * Execute a parameterized Cypher query and return raw rows as plain objects.
   */
  async queryCypher<T = unknown>(query: string, params?: Readonly<Record<string, unknown>>): Promise<readonly T[]> {
    return this.withSession("READ", async (s) => {
      const res = await s.run(query, params ?? {});
      const rows: T[] = res.records.map((r: Neo4jRecord) => r.toObject() as unknown as T);
      return rows as readonly T[];
    });
  }

  /**
   * Return a list of triples optionally filtered by dataset.
   */
  async getAllEdges(filters?: GraphFilters, limit = 100): Promise<readonly GraphTriple[]> {
    const dataset = filters?.dataset ?? this.datasetDefault ?? null;
    const query = `
      MATCH (a)-[r]->(b)
      WHERE $dataset IS NULL OR r.dataset = $dataset OR a.dataset = $dataset OR b.dataset = $dataset
      RETURN {
        source: { label: labels(a)[0], key: a.key },
        relationship: { type: type(r) },
        target: { label: labels(b)[0], key: b.key }
      } AS triple
      LIMIT $limit
    `;
    return this.withSession("READ", async (s) => {
      const res = await s.run(query, { dataset, limit });
      const triples: GraphTriple[] = res.records.map((r: Neo4jRecord) => {
        const t = r.get("triple") as unknown as { source: GraphNodeRef; relationship: GraphEdgeRef; target: GraphNodeRef };
        return { source: t.source, relationship: t.relationship, target: t.target };
      });
      return triples as readonly GraphTriple[];
    });
  }

  /**
   * Delete nodes (and attached relationships) matching optional dataset filter and return deleted count estimate.
   */
  async deleteAll(filters?: GraphFilters): Promise<number> {
    const dataset = filters?.dataset ?? this.datasetDefault ?? null;
    return this.withSession("WRITE", async (s) => {
      const countQuery = `
        MATCH (n)
        WHERE $dataset IS NULL OR n.dataset = $dataset
        RETURN count(n) AS c
      `;
      const cRes = await s.run(countQuery, { dataset });
      const cVal = cRes.records[0]?.get("c") as unknown as number | Neo4jInteger;
      const before = typeof cVal === "object" && cVal !== null && "toNumber" in (cVal as Neo4jInteger)
        ? (cVal as Neo4jInteger).toNumber()
        : ((cVal as number) ?? 0);

      const delQuery = `
        MATCH (n)
        WHERE $dataset IS NULL OR n.dataset = $dataset
        DETACH DELETE n
      `;
      await s.run(delQuery, { dataset });
      return before;
    });
  }
}
