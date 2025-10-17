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
      const price = (Number(omin) + Number(omax)) / 2;
      const size = Number(volume);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, marketId: slug, side: "Buy", price, size }),
      });
      if (!res.ok) throw new Error(`order ${res.status}`);
      setState({ stage: "submitting", signature: undefined });
      setState({ stage: "confirming", signature: "db", confirmations: 1, target: 1 });
      setState({ stage: "finalized", signature: "db" });
    } catch (e: any) {
      setState({ stage: "error", message: e?.message ?? "Failed to place order" });
    }
  }, [id.connected]);

  return { state, setState, placeOrder } as const;
}
