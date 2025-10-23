"use client";

import * as React from "react";

export function LiquidityStats({ liquidity, volume24h }: { liquidity?: number; volume24h?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <div className="text-muted-foreground">Liquidity</div>
        <div className="font-medium">${(liquidity || 0).toLocaleString()}</div>
      </div>
      <div>
        <div className="text-muted-foreground">24h Volume</div>
        <div className="font-medium">${(volume24h || 0).toLocaleString()}</div>
      </div>
    </div>
  );
}
