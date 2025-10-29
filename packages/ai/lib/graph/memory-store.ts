/**
 * In-memory GraphStore implementation for tests and local dev.
 */
import type {
  GraphEdgeRef,
  GraphFilters,
  GraphNodeRef,
  GraphStore,
  GraphTriple,
  Properties,
} from "./types";

export class InMemoryGraphStore implements GraphStore {
  private readonly nodes = new Map<string, { label: string; key: string; props: Properties; dataset?: string | null }>();
  private readonly edges: Array<{
    from: GraphNodeRef;
    type: string;
    to: GraphNodeRef;
    props?: Properties;
    dataset?: string | null;
  }> = [];

  async upsertNode(label: string, key: string, props: Properties, filters?: GraphFilters): Promise<GraphNodeRef> {
    const k = `${label}:${key}`;
    const prev = this.nodes.get(k);
    const merged = { label, key, props: { ...(prev?.props ?? {}), ...props }, dataset: filters?.dataset ?? prev?.dataset ?? null };
    this.nodes.set(k, merged);
    return { label, key };
  }

  async upsertEdge(from: GraphNodeRef, type: string, to: GraphNodeRef, props?: Properties, filters?: GraphFilters): Promise<GraphEdgeRef> {
    // ensure nodes exist
    const fk = `${from.label}:${from.key}`;
    const tk = `${to.label}:${to.key}`;
    if (!this.nodes.has(fk)) this.nodes.set(fk, { label: from.label, key: from.key, props: {}, dataset: filters?.dataset ?? null });
    if (!this.nodes.has(tk)) this.nodes.set(tk, { label: to.label, key: to.key, props: {}, dataset: filters?.dataset ?? null });

    const existing = this.edges.find((e) => e.from.label === from.label && e.from.key === from.key && e.to.label === to.label && e.to.key === to.key && e.type === type);
    if (existing) {
      existing.props = { ...(existing.props ?? {}), ...(props ?? {}) };
      existing.dataset = filters?.dataset ?? existing.dataset ?? null;
      return { type };
    }
    this.edges.push({ from, type, to, props, dataset: filters?.dataset ?? null });
    return { type };
  }

  async queryCypher<T = unknown>(_query: string, _params?: Readonly<Record<string, unknown>>): Promise<readonly T[]> {
    // Not implemented for the in-memory store; tests should use getAllEdges instead.
    return [] as const;
  }

  async getAllEdges(filters?: GraphFilters, limit = 100): Promise<readonly GraphTriple[]> {
    const ds = filters?.dataset;
    const triples: GraphTriple[] = [];
    for (const e of this.edges) {
      if (ds == null || e.dataset === ds) {
        triples.push({ source: e.from, relationship: { type: e.type }, target: e.to });
        if (triples.length >= limit) break;
      }
    }
    return triples;
  }

  async deleteAll(filters?: GraphFilters): Promise<number> {
    const before = this.nodes.size + this.edges.length;
    if (!filters?.dataset) {
      this.nodes.clear();
      this.edges.length = 0;
      return before;
    }
    const ds = filters.dataset;
    // remove edges by dataset
    for (let i = this.edges.length - 1; i >= 0; i--) {
      if (this.edges[i]!.dataset === ds) this.edges.splice(i, 1);
    }
    // remove nodes by dataset
    for (const [k, v] of this.nodes) {
      if (v.dataset === ds) this.nodes.delete(k);
    }
    const after = this.nodes.size + this.edges.length;
    return before - after;
  }
}
