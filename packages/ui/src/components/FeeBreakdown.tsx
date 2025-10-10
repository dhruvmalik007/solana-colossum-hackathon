"use client";

import * as React from "react";

export function FeeBreakdown({ platformBps, creatorBps, sizeUSD }: { platformBps: number; creatorBps: number; sizeUSD: number }) {
  const platform = Math.round((sizeUSD * platformBps) / 10000);
  const creator = Math.round((sizeUSD * creatorBps) / 10000);
  const total = platform + creator;
  return (
    <div className="grid grid-cols-2 gap-1 text-sm">
      <div className="text-muted-foreground">Platform</div>
      <div className="text-right">${platform.toLocaleString()}</div>
      <div className="text-muted-foreground">Creator</div>
      <div className="text-right">${creator.toLocaleString()}</div>
      <div className="font-medium">Total</div>
      <div className="text-right font-medium">${total.toLocaleString()}</div>
    </div>
  );
}
