"use client";

import * as React from "react";

// Dynamic requires to avoid build-time coupling across versions
// eslint-disable-next-line @typescript-eslint/no-var-requires
let Privy: any = {};
try { Privy = require("@privy-io/react-auth"); } catch (_) {}
// eslint-disable-next-line @typescript-eslint/no-var-requires
let SolanaReact: any = {};
try { SolanaReact = require("@solana/react"); } catch (_) {}
// eslint-disable-next-line @typescript-eslint/no-var-requires
let SolanaKit: any = {};
try { SolanaKit = require("@solana/kit"); } catch (_) {}

export type WalletIdentity = {
  source: "privy" | "solana-react" | "none";
  publicKey?: string;
  connected: boolean;
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  signTransaction?: (tx: any) => Promise<any>;
  sendAndConfirm?: (txOrBytes: any) => Promise<string>;
};

export function useWalletIdentity(): WalletIdentity {
  // Privy
  const { usePrivy, useWallets } = Privy ?? {};
  const privyCtx = typeof usePrivy === "function" ? usePrivy() : ({} as any);
  const walletsCtx = typeof useWallets === "function" ? useWallets() : ({ wallets: [] } as any);
  const privyWallet = Array.isArray(walletsCtx.wallets)
    ? walletsCtx.wallets.find((w: any) => w?.chainType === "solana" && (w?.isConnected || w?.address))
    : undefined;

  // Solana React
  const srWallet = typeof SolanaReact.useWallet === "function" ? SolanaReact.useWallet() : ({} as any);
  const srConn = typeof SolanaReact.useConnection === "function" ? SolanaReact.useConnection() : ({} as any);

  // Prefer Privy if authenticated + solana wallet present
  if (privyCtx?.authenticated && privyWallet?.address) {
    const connect = async () => privyCtx?.login?.();
    const disconnect = async () => privyCtx?.logout?.();

    const signTransaction = async (tx: any) => {
      if (typeof privyWallet?.signTransaction === "function") return privyWallet.signTransaction(tx);
      if (typeof privyWallet?.signAndSendTransaction === "function") return privyWallet.signAndSendTransaction(tx);
      throw new Error("Privy wallet does not support signTransaction");
    };

    const sendAndConfirm = async (txOrBytes: any) => {
      if (typeof privyWallet?.signAndSendTransaction === "function") {
        const res = await privyWallet.signAndSendTransaction(txOrBytes);
        // res could be signature or object; normalize
        return typeof res === "string" ? res : (res?.signature || res?.txSig || "");
      }
      if (srConn?.connection) {
        // try to send via connection directly
        // some wallets inject provider that auto-sends; otherwise expect serialized bytes
        const sig = await srConn.connection.sendRawTransaction(txOrBytes);
        return sig;
      }
      throw new Error("No connection available to send transaction");
    };

    return {
      source: "privy",
      publicKey: privyWallet.address,
      connected: true,
      connect,
      disconnect,
      signTransaction,
      sendAndConfirm,
    };
  }

  // Fallback to Solana React
  if (srWallet?.connected && srWallet?.publicKey) {
    const connect = async () => srWallet?.connect?.();
    const disconnect = async () => srWallet?.disconnect?.();

    const signTransaction = async (tx: any) => {
      if (typeof srWallet?.signTransaction === "function") return srWallet.signTransaction(tx);
      throw new Error("Wallet does not support signTransaction");
    };

    const sendAndConfirm = async (txOrBytes: any) => {
      if (typeof srWallet?.sendTransaction === "function") {
        // supports Transaction/VersionedTransaction
        const sig = await srWallet.sendTransaction(txOrBytes, srConn?.connection);
        return sig;
      }
      if (srConn?.connection) {
        const sig = await srConn.connection.sendRawTransaction(txOrBytes);
        return sig;
      }
      throw new Error("No connection available to send transaction");
    };

    return {
      source: "solana-react",
      publicKey: srWallet.publicKey?.toString?.(),
      connected: true,
      connect,
      disconnect,
      signTransaction,
      sendAndConfirm,
    };
  }

  return { source: "none", connected: false };
}
