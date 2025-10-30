export * from "ai";
export * from "./lib/memory";

// Primary class-based interface
export { MemoryManager } from "./lib/memory";
export type { MemoryInit, MemoryConfig } from "./lib/memory";
export type { GraphStore, GraphFilters, GraphNodeRef, GraphEdgeRef, GraphTriple } from "./lib/graph/types";
export { Labels, Rels } from "./lib/graph/types";
export { Neo4jGraphStore } from "./lib/graph/neo4j";
export { InMemoryGraphStore } from "./lib/graph/memory-store";
export * from "./lib/graph/ontology";
