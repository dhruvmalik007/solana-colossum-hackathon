import { Connection } from "@solana/web3.js";
import { Marinade, MarinadeConfig, MarinadeState } from "@marinade.finance/marinade-ts-sdk";
import type { LSTConnector, FetchOptions, LSTInfo } from "../types";

export class MarinadeConnector implements LSTConnector {
  id = "marinade" as const;
  kind = "lst" as const;
  private connection!: Connection;
  private marinade!: Marinade;
  async init(connection: Connection): Promise<void> {
    this.connection = connection;
    const cfg = new MarinadeConfig({ connection });
    this.marinade = new Marinade(cfg);
  }
  async getStakePools(_opts?: FetchOptions): Promise<LSTInfo[]> {
    const state = await MarinadeState.fetch(this.marinade);
    const mint = state.mSolMintAddress.toBase58();
    const price = state.mSolPrice;
    return [
      {
        tokenMint: mint,
        symbol: "mSOL",
        price,
      },
    ];
  }
}
