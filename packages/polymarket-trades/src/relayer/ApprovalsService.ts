import { BigNumber, utils } from "ethers";
import { OperationType, SafeTransaction } from "@polymarket/builder-relayer-client";
import { RelayerClientWrapper } from "./RelayerClient";

/**
 * ApprovalsService
 *
 * Creates and submits Safe transactions to set ERC20 approvals for the CTF/Exchange.
 */
export interface ApprovalsServiceOptions {
  usdcAddress: string;
  ctfAddress: string;
}

/**
 * Construct an ERC20 approve(to, amount) calldata.
 */
function buildApproveCalldata(spender: string, amount: BigNumber): string {
  const erc20Iface = new utils.Interface([
    "function approve(address spender, uint256 amount) external returns (bool)",
  ]);
  return erc20Iface.encodeFunctionData("approve", [spender, amount]);
}

/**
 * Sets MaxUint256 approval from the Safe to the CTF exchange for USDC.
 */
export class ApprovalsService {
  private readonly relayer: RelayerClientWrapper;
  private readonly usdc: string;
  private readonly ctf: string;

  constructor(relayer: RelayerClientWrapper, opts: ApprovalsServiceOptions) {
    this.relayer = relayer;
    this.usdc = opts.usdcAddress;
    this.ctf = opts.ctfAddress;
  }

  /**
   * Ensure approval by executing a single Safe transaction that calls ERC20 approve.
   */
  async ensureCtfUsdcApproval(): Promise<{ transactionHash: string }> {
    const tx: SafeTransaction = {
      to: this.usdc,
      operation: OperationType.Call,
      data: buildApproveCalldata(this.ctf, BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")),
      value: "0",
    };

    const { transactionHash } = await this.relayer.executeSafeTransactions([tx], "Approve USDC for CTF");
    return { transactionHash };
  }
}
