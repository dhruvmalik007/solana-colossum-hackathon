/**
 * Specification: Graph ontology helpers and MemoryManager graph integration
 *
 * This suite validates that:
 * - InMemoryGraphStore upserts nodes and edges deterministically.
 * - Ontology helpers map domain objects (pools, reserves, LSTs) to graph nodes
 *   and relationships using Labels and Rels.
 * - MemoryManager can accept a GraphStore and expose graph* helpers.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryGraphStore } from "../lib/graph/memory-store";
import { Labels, Rels, type GraphTriple } from "../lib/graph/types";
import { upsertProtocol, upsertPool, upsertReserve, upsertStakePool } from "../lib/graph/ontology";
import { MemoryManager } from "../lib/memory";

const dataset = "test-dataset";

describe("Graph ontology + MemoryManager integration", () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
  });

  it("upserts protocol and pool and links them with HAS_POOL", async () => {
    const protocolId = "raydium";
    await upsertProtocol(store, protocolId, { website: "https://raydium.io" }, { dataset });
    await upsertPool(
      store,
      protocolId,
      {
        address: "pool1",
        baseMint: "SOL",
        quoteMint: "USDC",
        tvlUsd: 12345,
        volume24hUsd: 678,
        feeBps: 25,
      },
      { dataset }
    );

    const edges = (await store.getAllEdges({ dataset }, 10)) as GraphTriple[];
    expect(edges.length).toBeGreaterThan(0);
    const hasPool = edges.find((e) => e.relationship.type === Rels.HAS_POOL);
    expect(hasPool?.source.label).toBe(Labels.Protocol);
    expect(hasPool?.target.label).toBe(Labels.Pool);
  });

  it("upserts reserve and stake pool and links to protocol", async () => {
    const protocolId = "marginfi";
    await upsertReserve(
      store,
      protocolId,
      {
        address: "reserve1",
        mint: "USDC",
        symbol: "USDC",
        supplyApy: 2.5,
        borrowApy: 6.1,
        totalSupply: 1000000,
        totalBorrow: 250000,
      },
      { dataset }
    );
    await upsertStakePool(
      store,
      protocolId,
      {
        tokenMint: "bSOL",
        symbol: "bSOL",
        apy: 7.2,
        price: 1.01,
        tvlUsd: 50000,
      },
      { dataset }
    );

    const edges = (await store.getAllEdges({ dataset }, 50)) as GraphTriple[];
    const hasReserve = edges.find((e) => e.relationship.type === Rels.HAS_RESERVE);
    const hasStake = edges.find((e) => e.relationship.type === Rels.HAS_STAKEPOOL);
    expect(hasReserve).toBeTruthy();
    expect(hasStake).toBeTruthy();
  });

  it("MemoryManager graph helpers delegate to GraphStore", async () => {
    const mm = MemoryManager.getInstance();
    mm.setGraphStore(store);
    await mm.graphUpsertNode(Labels.Protocol, "defillama", { role: "data" }, { dataset });
    await mm.graphUpsertNode(Labels.Chain, "solana", { id: 101 }, { dataset });
    await mm.graphUpsertEdge(
      { label: Labels.Protocol, key: "defillama" },
      Rels.SUPPORTS_CHAIN,
      { label: Labels.Chain, key: "solana" },
      { since: 2021 },
      { dataset }
    );

    const edges = (await store.getAllEdges({ dataset }, 10)) as GraphTriple[];
    const rel = edges.find((e) => e.relationship.type === Rels.SUPPORTS_CHAIN);
    expect(rel?.source.key).toBe("defillama");
    expect(rel?.target.key).toBe("solana");
  });
});
