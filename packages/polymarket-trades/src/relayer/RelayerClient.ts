import { Wallet, providers } from "ethers";
import { RelayClient, OperationType, SafeTransaction } from "@polymarket/builder-relayer-client";
import { PolymarketConfig, RpcConfig } from "../types";
import { BuilderSigning, BuilderSigningOptions } from "../signing/BuilderSigning";

/**
 * RelayerClientOptions
 * Configuration for initializing a RelayClient with an ethers signer and builder signing.
 */
export interface RelayerClientOptions {
  /**
   * Polymarket configuration.
   */
  config: PolymarketConfig;
  /**
   * RPC configuration.
   */
  rpc: RpcConfig;
  /**
   * Builder signing options.
   */
  signing: BuilderSigningOptions;
  /**
   * Optional wallet private key.
   */
  walletPrivateKey?: string;
  /**
   * Optional wallet signer.
   */
  walletSigner?: Wallet;
}

/**
 * RelayerClient
 * Thin wrapper around @polymarket/builder-relayer-client's RelayClient.
 */
export class RelayerClientWrapper {
  private readonly client: RelayClient;

  /**
   * Initialize the RelayClient with either a Wallet or a private key + RPC URL.
   * @param opts RelayerClientOptions
   */
  constructor(opts: RelayerClientOptions) {
    const provider = new providers.JsonRpcProvider(opts.rpc.rpcUrl);
    const signer = opts.walletSigner ?? new Wallet(String(opts.walletPrivateKey || ""), provider);

    const builderConfig = new BuilderSigning(opts.signing).toBuilderConfig();
    this.client = new RelayClient(opts.config.relayerUrl, opts.config.chainId, signer, builderConfig );
  }

  /**
   * Deploy a Safe wallet via the relayer and wait for confirmation.
   * @returns {Promise<{ transactionHash: string; proxyAddress: string }>} 
   */
  async deploySafe(): Promise<{ transactionHash: string; proxyAddress: string }> {
    const resp = await this.client.deploy();
    const result = await resp.wait();
    if (!result) throw new Error("Relayer: Safe deployment failed or timed out");
    return { transactionHash: result.transactionHash, proxyAddress: result.proxyAddress };
  }

  /**
   * Execute a batch of Safe transactions with optional metadata and wait for confirmation.
   */
  async executeSafeTransactions(
    txs: SafeTransaction[],
    metadata?: string
  ): Promise<{ transactionHash: string; state: string }> {
    const resp = await this.client.execute(txs, metadata);
    const result = await resp.wait();
    if (!result) throw new Error("Relayer: transaction failed or timed out");
    return { transactionHash: result.transactionHash, state: result.state };
  }
}

export { OperationType, SafeTransaction };
