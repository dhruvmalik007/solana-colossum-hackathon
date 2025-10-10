"use client";

import * as React from "react";
import type { TxStatusState } from "@repo/ui/components/TxnStatus";
import { useWalletIdentity } from "../solana/useWalletIdentity";

// dynamic requires to avoid version coupling
// eslint-disable-next-line @typescript-eslint/no-var-requires
let SolanaKit: any = {};
try { SolanaKit = require("@solana/kit"); } catch (_) {}

export function usePlaceRangeOrder(slug: string) {
  const id = useWalletIdentity();
  const [state, setState] = React.useState<TxStatusState>({ stage: "idle" });

  const placeOrder = React.useCallback(async (omin: number, omax: number, volume: number) => {
    if (!id.connected) {
      setState({ stage: "error", message: "Connect wallet first" });
      return;
    }
    try {
      setState({ stage: "signing" });

      // TODO: build real instruction once Anchor program ready.
      // For now, simulate or send a memo-like tx to verify wallet flow
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      await sleep(300);
      setState({ stage: "submitting", signature: undefined });
      await sleep(400);
      setState({ stage: "confirming", signature: "pending", confirmations: 1, target: 32 });
      await sleep(600);
      setState({ stage: "finalized", signature: "demo" });
    } catch (e: any) {
      setState({ stage: "error", message: e?.message ?? "Failed to place order" });
    }
  }, [id.connected]);

  return { state, setState, placeOrder } as const;
}
