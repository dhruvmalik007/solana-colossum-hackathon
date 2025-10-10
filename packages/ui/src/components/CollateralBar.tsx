"use client";

import * as React from "react";
import { Progress } from "@repo/ui/components/ui/progress";

export function CollateralBar({ required, posted }: { required: number; posted: number }) {
  const pct = Math.min(100, required === 0 ? 0 : (posted / required) * 100);
  const under = posted < required;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Collateral</span>
        <span>
          {posted.toLocaleString()} / {required.toLocaleString()} USDC
        </span>
      </div>
      <Progress value={pct} />
      {under ? (
        <div className="text-[11px] text-rose-600">Additional collateral required</div>
      ) : null}
    </div>
  );
}
