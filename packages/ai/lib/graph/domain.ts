/**
 * Minimal domain types aligned with packages/indexer shapes, without creating a
 * hard dependency on @repo/indexer.
 */

export interface PoolSummary {
  readonly address: string;
  readonly baseMint: string;
  readonly quoteMint: string;
  readonly tvlUsd?: number;
  readonly volume24hUsd?: number;
  readonly feeBps?: number;
}

export interface LendingReserve {
  readonly address: string;
  readonly mint: string;
  readonly symbol?: string;
  readonly supplyApy?: number;
  readonly borrowApy?: number;
  readonly totalSupply?: number;
  readonly totalBorrow?: number;
}

export interface LSTInfo {
  readonly tokenMint: string;
  readonly symbol: string;
  readonly apr?: number;
  readonly apy?: number;
  readonly price?: number;
  readonly tvlUsd?: number;
}
