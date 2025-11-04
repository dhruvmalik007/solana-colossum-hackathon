/*
 * Type definitions for the Polymarket trading engine wrappers and strategies.
 */

/**
 * Order side enumeration aligned with @polymarket/clob-client Side.
 */
export enum Side {
  BUY = "BUY",
  SELL = "SELL",
}

/**
 * Order type enumeration aligned with @polymarket/clob-client OrderType.
 */
export enum OrderType {
  GTC = "GTC",
  FOK = "FOK",
  GTD = "GTD",
}

/**
 * User-facing order parameters.
 * Price is denominated in quote token per share (e.g., USDC), size in shares.
 */
export interface UserOrderArgs {
  tokenId: string;
  price: number;
  size: number;
  side: Side;
  feeRateBps?: number;
  negRisk?: boolean;
  expirationSec?: number;
}

/**
 * Response subset returned by Polymarket on order placement.
 */
export interface PostOrderResponse {
  success: boolean;
  orderId?: string;
  status?: "matched" | "live" | "delayed" | "unmatched";
  errorMsg?: string;
  orderHashes?: string[];
}

/**
 * Minimal market information required to place an order.
 */
export interface MarketInfo {
  tokenId: string;
  tickSize: number;
  negRisk: boolean;
}

/**
 * Gaussian distribution parameters for generating a price ladder.
 */
export interface GaussianParams {
  mean: number;
  sigma: number;
  levels: number;
  spacing: "sigma" | "fixed";
  side: Side;
  totalSize: number;
  minPerOrder: number;
  clamp?: { min: number; max: number };
}

/**
 * A generated order before translation to maker/taker amounts.
 */
export interface GeneratedOrder {
  price: number;
  size: number;
  side: Side;
}

/**
 * Liquidity policy for limiting batch order sizes and skew.
 */
export interface LiquidityPolicy {
  maxTotalSize: number;
  maxPerOrder?: number;
  minPerOrder: number;
  maxSkewPct?: number;
}

/**
 * Minimal identity claims resulting from Privy token verification.
 */
export interface PrivyClaims {
  userId: string;
  email?: string;
}

/**
 * Mapping between an authenticated user and their EVM Safe address.
 */
export interface VerifiedUser {
  userId: string;
  evmSafe?: string;
  funderAddress?: string;
}

/**
 * High-level Polymarket integration configuration.
 */
export interface PolymarketConfig {
  clobHost: string;
  chainId: 137 | 80002;
  relayerUrl: string;
  marketsApiBase?: string;
  tickSizeFallback?: number;
}

/**
 * Tick size as a string literal per clob-client's TickSize type.
 */
export type TickString = "0.1" | "0.01" | "0.001" | "0.0001";

/**
 * Local credentials for builder signing (server-side).
 */
export interface BuilderLocalCreds {
  key: string;
  secret: string;
  passphrase: string;
}

/**
 * Remote builder signing server configuration.
 */
export interface BuilderRemoteSigning {
  url: string;
}

/**
 * RPC configuration for the Ethers provider.
 */
export interface RpcConfig {
  rpcUrl: string;
}
