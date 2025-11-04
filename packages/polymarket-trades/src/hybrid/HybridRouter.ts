import { ClobClientWrapper } from "../clob/ClobClient";
import { TickString } from "../types";
import { MarketInfoService } from "../clob/MarketInfoService";
import { GeneratedOrder, MarketInfo, OrderType, UserOrderArgs, VerifiedUser } from "../types";

/**
 * HybridRouter
 *
 * Places batches of CLOB orders (AMM path reserved for future Solana router integration).
 */
export class HybridRouter {
  private readonly clob: ClobClientWrapper;
  private readonly marketInfo: MarketInfoService;

  constructor(clob: ClobClientWrapper, marketInfo: MarketInfoService) {
    this.clob = clob;
    this.marketInfo = marketInfo;
  }

  /**
   * Convert numeric tick to the string union required by clob-client.
   */
  private toTickString(n: number): TickString {
    const f = Number(n).toFixed(4);
    if (f === "0.1000") return "0.1";
    if (f === "0.0100") return "0.01";
    if (f === "0.0010") return "0.001";
    return "0.0001";
  }

  /**
   * Place a batch of orders on the CLOB.
   * - Resolves market info (tickSize, negRisk) from Polymarket API.
   * - Iterates generated orders and posts them individually.
   * - Returns each post response.
   */
  async placeClobBatch(
    _user: VerifiedUser,
    marketIdOrToken: string,
    orders: GeneratedOrder[],
    orderType: OrderType = OrderType.GTC
  ): Promise<unknown[]> {
    const mi: MarketInfo = await this.marketInfo.getMarketInfo(marketIdOrToken);
    const tickString: TickString = this.toTickString(mi.tickSize);

    const results: unknown[] = [];
    for (const o of orders) {
      const args: UserOrderArgs = {
        tokenId: mi.tokenId,
        price: o.price,
        size: o.size,
        side: o.side,
      };
      const res = await this.clob.createAndPostOrder(args, { tickSize: tickString, negRisk: mi.negRisk }, orderType);
      results.push(res);
    }
    return results;
  }
}
