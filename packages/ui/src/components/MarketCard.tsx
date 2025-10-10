"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";

export type DistributionPoint = { x: number; y: number };

export function MarketCard({
  title,
  category,
  status,
  liquidity,
  volume24h,
  participants,
  onClick,
  right,
}: {
  title: string;
  category?: string;
  status?: string;
  liquidity?: number;
  volume24h?: number;
  participants?: number;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <Card className="cursor-pointer transition hover:shadow-md" onClick={onClick}>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{[category, status].filter(Boolean).join(" • ")}</CardDescription>
        </div>
        {right}
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground">Liquidity</div>
          <div className="font-medium">${(liquidity || 0).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-muted-foreground">24h Volume</div>
          <div className="font-medium">${(volume24h || 0).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Participants</div>
          <div className="font-medium">{(participants || 0).toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}
