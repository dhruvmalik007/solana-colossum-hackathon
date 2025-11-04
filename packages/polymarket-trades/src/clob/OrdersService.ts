import { GaussianOrderGenerator } from "../strategy/GaussianOrderGenerator";
import { LiquidityManager } from "../strategy/LiquidityManager";
import { MarketInfoService } from "./MarketInfoService";
import { ClobClientWrapper } from "./ClobClient";
import {
  GeneratedOrder,
  GaussianParams,
  LiquidityPolicy,
  MarketInfo,
  OrderType,
  UserOrderArgs,
} from "../types";
import { HybridRouter } from "../hybrid/HybridRouter";

/**
 * OrdersService: Orchestrates order generation and placement on Polymarket CLOB.
 */
export class OrdersService {
  private readonly clob: ClobClientWrapper;
  private readonly marketInfo: MarketInfoService;
  private readonly generator = new GaussianOrderGenerator();
  private readonly liquidity = new LiquidityManager();
  private readonly router: HybridRouter;

  constructor(clob: ClobClientWrapper, marketInfo: MarketInfoService) {
    this.clob = clob;
    this.marketInfo = marketInfo;
    this.router = new HybridRouter(this.clob, this.marketInfo);
  }

  /**
   * Place a single user order given full args and order type.
   */
  async placeSingle(args: UserOrderArgs, orderType: OrderType = OrderType.GTC): Promise<unknown> {
    const mi: MarketInfo = await this.marketInfo.getMarketInfo(args.tokenId);
    // Tick string conversion is handled inside HybridRouter
    return this.router.placeClobBatch(
      { userId: "" }, // user mapping not required for posting via clob-client
      mi.tokenId,
      [{ price: args.price, size: args.size, side: args.side }],
      orderType
    ).then((res) => res[0]);
  }

  /**
   * Generate and place a Gaussian ladder of orders.
   */
  async placeGaussianBatch(
    marketIdOrToken: string,
    gaussian: GaussianParams,
    policy: LiquidityPolicy,
    orderType: OrderType = OrderType.GTC
  ): Promise<unknown[]> {
    const mi = await this.marketInfo.getMarketInfo(marketIdOrToken);
    const rawOrders: GeneratedOrder[] = this.generator.generate(gaussian, mi.tickSize);
    const bounded = this.liquidity.enforce(rawOrders, policy);
    return this.router.placeClobBatch({ userId: "" }, mi.tokenId, bounded, orderType);
  }

  /**
   * Fetch open orders with optional server filtering.
   */
  async getOpenOrders(params?: { id?: string; market?: string; asset_id?: string }): Promise<unknown[]> {
    return this.clob.getOpenOrders(params, true);
  }

  /**
   * Cancel a single order by server orderID.
   */
  async cancelOrder(orderID: string): Promise<{ success: boolean }> {
    return this.clob.cancelOrder(orderID);
  }

  /**
   * Cancel multiple orders by hash array.
   */
  async cancelOrders(orderHashes: string[]): Promise<{ success: boolean }> {
    return this.clob.cancelOrders(orderHashes);
  }
}
