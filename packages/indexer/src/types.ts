import { Connection } from "@solana/web3.js";

export type ProtocolId =
  | "jupiter"
  | "raydium"
  | "orca"
  | "meteora"
  | "solend"
  | "marginfi"
  | "kamino"
  | "drift"
  | "zeta"
  | "mango"
  | "phoenix"
  | "openbook"
  | "marinade"
  | "jito"
  | "parcl"
  | "defillama";

export type ConnectorKind = "dex" | "lending" | "perps" | "lst" | "data";

export type FetchOptions = {
  limit?: number;
  cursor?: string;
  since?: number;
  until?: number;
};

export type PriceQuote = {
  inMint: string;
  outMint: string;
  inAmount?: string;
  outAmount?: string;
  slippageBps?: number;
  raw?: any;
};

export type PoolSummary = {
  address: string;
  baseMint: string;
  quoteMint: string;
  tvlUsd?: number;
  volume24hUsd?: number;
  feeBps?: number;
};

export type LendingReserve = {
  address: string;
  mint: string;
  symbol?: string;
  supplyApy?: number;
  borrowApy?: number;
  totalSupply?: number;
  totalBorrow?: number;
};

export type LSTInfo = {
  tokenMint: string;
  symbol: string;
  apr?: number;
  apy?: number;
  price?: number;
  tvlUsd?: number;
};

export interface ProtocolConnector {
  id: ProtocolId;
  kind: ConnectorKind;
  init(connection: Connection, opts?: any): Promise<void>;
}

export interface DexConnector extends ProtocolConnector {
  getPools(opts?: FetchOptions): Promise<PoolSummary[]>;
  getQuote(
    inputMint: string,
    outputMint: string,
    amount: string | number,
    opts?: { slippageBps?: number; txVersion?: "LEGACY" | "V0" }
  ): Promise<PriceQuote>;
}

export interface LendingConnector extends ProtocolConnector {
  getReserves(opts?: FetchOptions): Promise<LendingReserve[]>;
}

export interface LSTConnector extends ProtocolConnector {
  getStakePools(opts?: FetchOptions): Promise<LSTInfo[]>;
}
