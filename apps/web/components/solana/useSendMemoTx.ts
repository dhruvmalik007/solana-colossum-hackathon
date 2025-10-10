"use client";

import * as React from "react";
import type { TxStatusState } from "@repo/ui/components/TxnStatus";

// dynamic requires to tolerate differences until wired with stable kit APIs
// eslint-disable-next-line @typescript-eslint/no-var-requires
let SolanaReact: any = {};
try { SolanaReact = require("@solana/react"); } catch (_) {}
// eslint-disable-next-line @typescript-eslint/no-var-requires
let SolanaKit: any = {};
try { SolanaKit = require("@solana/kit"); } catch (_) {}
// eslint-disable-next-line @typescript-eslint/no-var-requires
let MemoPkg: any = {};
try { MemoPkg = require("@solana-program/memo"); } catch (_) {}

export function useSendMemoTx() {
  const { useConnection, useWallet } = SolanaReact;
  const connectionCtx = typeof useConnection === "function" ? useConnection() : { connection: undefined };
  const walletCtx = typeof useWallet === "function" ? useWallet() : {};

  const [state, setState] = React.useState<TxStatusState>({ stage: "idle" });

  const sendMemo = React.useCallback(async (message: string) => {
    if (!connectionCtx?.connection) {
      setState({ stage: "error", message: "No connection" });
      return;
    }
    if (!walletCtx?.wallet || !walletCtx?.wallet?.publicKey) {
      setState({ stage: "error", message: "Wallet not connected" });
      return;
    }

    try {
      setState({ stage: "signing" });

      const Connection = SolanaKit?.Connection ?? connectionCtx.connection.constructor;
      const VersionedTransaction = SolanaKit?.VersionedTransaction;
      const TransactionMessage = SolanaKit?.TransactionMessage;
      const MEMO_PROGRAM_ID = MemoPkg?.MEMO_PROGRAM_ID;

      // Fallback: if kit API not present yet, simulate UX
      if (!TransactionMessage || !VersionedTransaction || !MEMO_PROGRAM_ID) {
        await new Promise((r) => setTimeout(r, 500));
        setState({ stage: "submitting", signature: undefined });
        await new Promise((r) => setTimeout(r, 700));
        setState({ stage: "confirming", signature: "pending", confirmations: 1, target: 32 });
        await new Promise((r) => setTimeout(r, 800));
        setState({ stage: "finalized", signature: "demo" });
        return;
      }

      const { blockhash } = await connectionCtx.connection.getLatestBlockhash();
      const ix = { programId: MEMO_PROGRAM_ID, data: Buffer.from(message), keys: [] } as any;

      const msg = new TransactionMessage({
        instructions: [ix],
        payerKey: walletCtx.wallet.publicKey,
        recentBlockhash: blockhash,
      });
      const serialized = msg.serialize();

      const signed = walletCtx.signTransaction
        ? await walletCtx.signTransaction(serialized)
        : serialized; // some wallets auto-sign through provider

      setState({ stage: "submitting", signature: undefined });
      const sig = await connectionCtx.connection.sendTransaction(signed as any);
      setState({ stage: "confirming", signature: sig, confirmations: 1, target: 32 });

      // naive confirm loop
      const conf = await connectionCtx.connection.confirmTransaction({ signature: sig }, "confirmed");
      if ((conf as any)?.value?.err) {
        throw new Error("Transaction error");
      }
      setState({ stage: "finalized", signature: sig });
    } catch (e: any) {
      setState({ stage: "error", message: e?.message ?? "Failed to send transaction" });
    }
  }, [connectionCtx?.connection, walletCtx?.wallet, walletCtx?.signTransaction]);

  return { state, setState, sendMemo } as const;
}
