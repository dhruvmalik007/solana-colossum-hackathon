"use client";

import * as React from "react";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/lib/utils";

export type TxStatusState =
  | { stage: "idle" }
  | { stage: "signing" }
  | { stage: "submitting"; signature?: string }
  | { stage: "confirming"; signature: string; confirmations?: number; target?: number }
  | { stage: "finalized"; signature: string }
  | { stage: "error"; message: string };

export function TxnStatus({ state, className }: { state: TxStatusState; className?: string }) {
  if (state.stage === "idle") return null;

  const explorer = state.stage !== "error" && state.stage !== "signing" ? (
    "signature" in state && state.signature ? (
      <a
        href={`https://solana.fm/tx/${state.signature}`}
        className="font-medium text-primary underline-offset-2 hover:underline"
        target="_blank"
        rel="noreferrer noopener"
      >
        View on Explorer
      </a>
    ) : null
  ) : null;

  return (
    <div className={cn("rounded-md border p-3 text-sm", className)}>
      {state.stage === "signing" && (
        <div className="flex items-center gap-2">
          <Spinner className="h-4 w-4" />
          <span>Approve the transaction in your wallet…</span>
        </div>
      )}
      {state.stage === "submitting" && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Spinner className="h-4 w-4" />
            <span>Submitting transaction…</span>
          </div>
          {explorer}
        </div>
      )}
      {state.stage === "confirming" && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Spinner className="h-4 w-4" />
            <span>
              Confirming ({state.confirmations ?? 0}/{state.target ?? 32})…
            </span>
          </div>
          {explorer}
        </div>
      )}
      {state.stage === "finalized" && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Finalized</Badge>
            <span className="text-emerald-600">Transaction successful</span>
          </div>
          {explorer}
        </div>
      )}
      {state.stage === "error" && (
        <div className="flex items-center gap-2 text-rose-600">
          <span>Transaction failed:</span>
          <span className="font-medium">{state.message}</span>
        </div>
      )}
    </div>
  );
}
