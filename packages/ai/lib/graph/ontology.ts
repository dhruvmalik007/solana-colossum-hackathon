/**
 * Ontology helper functions to upsert indexer-derived entities and relationships
 * into a GraphStore. Keeps domain mapping centralized and type-safe.
 */
import type { GraphFilters, GraphNodeRef, GraphStore } from "./types";
import { Labels, Rels } from "./types";
import type { PoolSummary, LendingReserve, LSTInfo } from "./domain";

/** Upserts a protocol node keyed by its identifier. */
export async function upsertProtocol(store: GraphStore, protocolId: string, props?: Record<string, string | number | boolean | null>, filters?: GraphFilters): Promise<GraphNodeRef> {
  return store.upsertNode(Labels.Protocol, protocolId, { ...(props ?? {}) }, filters);
}

/** Upserts a DEX pool node and connects it to a protocol. */
export async function upsertPool(store: GraphStore, protocolId: string, pool: PoolSummary, filters?: GraphFilters): Promise<{ protocol: GraphNodeRef; pool: GraphNodeRef }> {
  const protocol = await upsertProtocol(store, protocolId, undefined, filters);
  const poolNode = await store.upsertNode(Labels.Pool, pool.address, {
    baseMint: pool.baseMint,
    quoteMint: pool.quoteMint,
    tvlUsd: pool.tvlUsd ?? null,
    volume24hUsd: pool.volume24hUsd ?? null,
    feeBps: pool.feeBps ?? null,
  }, filters);
  await store.upsertEdge(protocol, Rels.HAS_POOL, poolNode, undefined, filters);
  return { protocol, pool: poolNode };
}

/** Upserts a lending reserve and attaches to a protocol. */
export async function upsertReserve(store: GraphStore, protocolId: string, reserve: LendingReserve, filters?: GraphFilters): Promise<{ protocol: GraphNodeRef; reserve: GraphNodeRef }> {
  const protocol = await upsertProtocol(store, protocolId, undefined, filters);
  const reserveNode = await store.upsertNode(Labels.Reserve, reserve.address, {
    mint: reserve.mint,
    symbol: reserve.symbol ?? null,
    supplyApy: reserve.supplyApy ?? null,
    borrowApy: reserve.borrowApy ?? null,
    totalSupply: reserve.totalSupply ?? null,
    totalBorrow: reserve.totalBorrow ?? null,
  }, filters);
  await store.upsertEdge(protocol, Rels.HAS_RESERVE, reserveNode, undefined, filters);
  return { protocol, reserve: reserveNode };
}

/** Upserts a LST stake pool node and attaches to a protocol. */
export async function upsertStakePool(store: GraphStore, protocolId: string, lst: LSTInfo, filters?: GraphFilters): Promise<{ protocol: GraphNodeRef; stakePool: GraphNodeRef }> {
  const protocol = await upsertProtocol(store, protocolId, undefined, filters);
  const stakeNode = await store.upsertNode(Labels.StakePool, lst.tokenMint, {
    symbol: lst.symbol,
    apr: lst.apr ?? null,
    apy: lst.apy ?? null,
    price: lst.price ?? null,
    tvlUsd: lst.tvlUsd ?? null,
  }, filters);
  await store.upsertEdge(protocol, Rels.HAS_STAKEPOOL, stakeNode, undefined, filters);
  return { protocol, stakePool: stakeNode };
}
