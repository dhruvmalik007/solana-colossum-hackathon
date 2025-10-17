import { Connection } from "@solana/web3.js";
import { fetchPoolMetadata } from "@solendprotocol/solend-sdk";
import type { LendingConnector, FetchOptions, LendingReserve } from "../types";

export class SolendConnector implements LendingConnector {
  id = "solend" as const;
  kind = "lending" as const;
  private connection!: Connection;

  async init(connection: Connection): Promise<void> {
    this.connection = connection;
  }

  async getReserves(_opts?: FetchOptions): Promise<LendingReserve[]> {
    try {
      // Fetch pool metadata from Solend's backend API
      // This returns pool and reserve data without needing all the on-chain parameters
      const pools = await fetchPoolMetadata(this.connection, "production");
      
      if (!pools || !Array.isArray(pools) || pools.length === 0) {
        console.warn("[Solend] No pools found");
        return [];
      }

      // Get the main pool reserves
      const mainPool = pools.find((p: any) => p.name === "Main Pool") || pools[0];
      
      if (!mainPool || !mainPool.reserves) {
        console.warn("[Solend] No reserves found in main pool");
        return [];
      }

      // Map reserves to our LendingReserve type
      return mainPool.reserves
        .filter((reserve: any) => reserve && reserve.asset)
        .map((reserve: any) => {
          // Extract APY values (already in percentage format from API)
          const supplyApy = reserve.supplyApy || reserve.supply?.apy || undefined;
          const borrowApy = reserve.borrowApy || reserve.borrow?.apy || undefined;

          // Extract supply/borrow amounts
          const totalSupply = reserve.totalSupply || reserve.totalDepositsWads ? 
            Number(reserve.totalDepositsWads) / 1e18 : undefined;
          const totalBorrow = reserve.totalBorrow || reserve.totalBorrowsWads ?
            Number(reserve.totalBorrowsWads) / 1e18 : undefined;

          return {
            address: reserve.address || reserve.liquidityAddress || "",
            mint: reserve.mintAddress || reserve.liquidityMint || reserve.asset || "",
            symbol: reserve.symbol || reserve.asset || "UNKNOWN",
            supplyApy,
            borrowApy,
            totalSupply,
            totalBorrow,
          };
        });
    } catch (error) {
      console.error("[Solend] Failed to fetch reserves:", error);
      return [];
    }
  }
}
