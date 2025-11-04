import { Wallet, providers } from "ethers";
import {
  ClobClient as PMClobClient,
  OrderType as PMOrderType,
  Side as PMSide,
  ApiKeyCreds,
  OpenOrderParams,
  OpenOrder,
  PostOrdersArgs,
} from "@polymarket/clob-client";
import { BuilderSigningOptions, BuilderSigning } from "../signing/BuilderSigning";
import { PolymarketConfig, UserOrderArgs, OrderType, Side, TickString } from "../types";

/**
 * Map internal OrderType to Polymarket SDK OrderType.
 */
function mapOrderType(type: OrderType): PMOrderType {
  switch (type) {
    case OrderType.FOK:
      return PMOrderType.FOK;
    case OrderType.GTD:
      return PMOrderType.GTD;
    default:
      return PMOrderType.GTC;
  }
}

/**
 * Map internal Side to Polymarket SDK Side.
 */
function mapSide(side: Side): PMSide {
  return side === Side.BUY ? PMSide.BUY : PMSide.SELL;
}

export interface ClobClientOptions {
  config: PolymarketConfig;
  eoaPrivateKey: string;
  signatureType: 0 | 1;
  funderAddress?: string;
  builderSigning?: BuilderSigningOptions;
  rpcUrl?: string; // optional if signer derives provider implicitly
}

/**
 * ClobClientWrapper
 * - Handles API key derivation and posting orders with builder attribution.
 */
export class ClobClientWrapper {
  private client?: PMClobClient;
  private readonly host: string;
  private readonly chainId: number;
  private readonly signatureType: 0 | 1;
  private readonly funder?: string;
  private readonly signer: Wallet;
  private readonly builderConfig?: ReturnType<BuilderSigning["toBuilderConfig"]>;

  /**
   * Construct with EOA private key and optional builder signing config.
   * Call initApiAuth() before placing orders.
   */
  constructor(opts: ClobClientOptions) {
    this.host = opts.config.clobHost;
    this.chainId = opts.config.chainId;
    this.signatureType = opts.signatureType;
    this.funder = opts.funderAddress;

    const provider = new providers.JsonRpcProvider(opts.rpcUrl ?? "");
    this.signer = new Wallet(opts.eoaPrivateKey, provider);

    if (opts.builderSigning) {
      this.builderConfig = new BuilderSigning(opts.builderSigning).toBuilderConfig();
    }
  }

  /**
   * Initialize API authentication by deriving or creating L2 API credentials.
   * Must be called once before order placement in a process lifecycle.
   */
  async initApiAuth(): Promise<void> {
    // Derive creds using a temporary client, then rebuild with creds + signatureType + funder.
    const temp = new PMClobClient(
      this.host,
      this.chainId,
      this.signer,
      undefined,
      undefined,
      undefined,
      undefined, // geoBlockToken
      false,     // useServerTime
      this.builderConfig
    );
    const creds: ApiKeyCreds = await temp.createOrDeriveApiKey();
    this.client = new PMClobClient(
      this.host,
      this.chainId,
      this.signer,
      creds,
      this.signatureType,
      this.funder,
      undefined, // geoBlockToken
      false,     // useServerTime
      this.builderConfig
    );
  }

  /**
   * Post a single order via createAndPostOrder using market metadata.
   * - marketMeta.tickSize should be a decimal string from Markets API (orderPriceMinTickSize)
   * - marketMeta.negRisk indicates NegRisk market behavior
   */
  async createAndPostOrder(
    args: UserOrderArgs,
    marketMeta: { tickSize: TickString; negRisk: boolean },
    orderType: OrderType = OrderType.GTC
  ): Promise<unknown> {
    if (!this.client) throw new Error("ClobClientWrapper: call initApiAuth() first");

    const orderArgs = {
      tokenID: args.tokenId,
      price: args.price,
      side: mapSide(args.side),
      size: args.size,
    } as const;

    const pmType = mapOrderType(orderType) === PMOrderType.GTD ? PMOrderType.GTD : PMOrderType.GTC;
    const resp = await this.client.createAndPostOrder(
      orderArgs,
      { tickSize: marketMeta.tickSize, negRisk: marketMeta.negRisk },
      pmType
    );
    return resp;
  }

  /**
   * Cancel multiple orders by hash.
   */
  async cancelOrders(orderHashes: string[]): Promise<{ success: boolean }> {
    if (!this.client) throw new Error("ClobClientWrapper: call initApiAuth() first");
    const resp = await this.client.cancelOrders(orderHashes);
    return { success: Boolean(resp) };
  }

  /**
   * Cancel a single order by ID.
   */
  async cancelOrder(orderID: string): Promise<{ success: boolean }> {
    if (!this.client) throw new Error("ClobClientWrapper: call initApiAuth() first");
    const resp = await this.client.cancelOrder({ orderID });
    return { success: Boolean(resp) };
  }

  /**
   * Fetch open orders, optionally filtered by id, market, or asset_id.
   */
  async getOpenOrders(params?: OpenOrderParams, onlyFirstPage = true): Promise<OpenOrder[]> {
    if (!this.client) throw new Error("ClobClientWrapper: call initApiAuth() first");
    const orders = await this.client.getOpenOrders(params, onlyFirstPage);
    return orders;
  }

  /**
   * Post multiple signed orders in a single request.
   */
  async postOrders(args: PostOrdersArgs[], deferExec = false): Promise<unknown> {
    if (!this.client) throw new Error("ClobClientWrapper: call initApiAuth() first");
    return this.client.postOrders(args, deferExec);
  }
}
