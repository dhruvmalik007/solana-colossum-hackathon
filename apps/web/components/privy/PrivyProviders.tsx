"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";

// dynamic optional utilities from @solana/kit for RPC config
// eslint-disable-next-line @typescript-eslint/no-var-requires
let SolanaKit: any = {};
try { SolanaKit = require("@solana/kit"); } catch (_) {}

export function PrivyProviders({ children }: { children: any }) {
  const { createSolanaRpc, createSolanaRpcSubscriptions } = SolanaKit ?? {};

  const solanaConfig = createSolanaRpc && createSolanaRpcSubscriptions ? {
    rpcs: {
      "solana:mainnet": {
        rpc: createSolanaRpc(process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || "https://api.mainnet-beta.solana.com"),
        rpcSubscriptions: createSolanaRpcSubscriptions(process.env.NEXT_PUBLIC_SOLANA_MAINNET_WS || "wss://api.mainnet-beta.solana.com"),
      },
      "solana:devnet": {
        rpc: createSolanaRpc(process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com"),
        rpcSubscriptions: createSolanaRpcSubscriptions(process.env.NEXT_PUBLIC_SOLANA_DEVNET_WS || "wss://api.devnet.solana.com"),
      },
    },
    embeddedWallets: { createOnLogin: "all-users" },
  } : undefined;

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["wallet", "email", "google"],
        appearance: {
          walletChainType: "solana-only",
          showWalletLoginFirst: true,
        },
        solana: solanaConfig,
      }}
    >
      {children}
    </PrivyProvider>
  );
}
