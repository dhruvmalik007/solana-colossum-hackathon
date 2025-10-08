"use client";

import { Button  } from "@repo/ui/components/ui/button";
import { Input  } from "@repo/ui/components/ui/input";
import { ShineBorder } from "@repo/ui/components/ui/shine-border";
import { AnimatedBeam } from "@repo/ui/components/ui/animated-beam";
import { Label } from "@repo/ui/components/ui/label";
import { Card } from "@repo/ui/components/ui/card";
import React from "react";

export default function TradePanel({ change1d }: { change1d: number }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const buyRef = React.useRef<HTMLButtonElement | null>(null);
  const sellRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <div className="relative rounded-lg border p-4">
      <ShineBorder borderWidth={1} duration={18} shineColor={["#34d399","#a78bfa","#60a5fa"]} />
      <div ref={containerRef} className="relative">
        <div className="grid grid-cols-2 gap-2">
          <Button ref={buyRef} variant="outline" className="h-10">Buy</Button>
          <Button ref={sellRef} variant="outline" className="h-10">Sell</Button>
        </div>
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={buyRef}
          toRef={sellRef}
          curvature={-30}
          pathColor="#a3a3a3"
          gradientStartColor="#22c55e"
          gradientStopColor="#3b82f6"
          pathOpacity={0.2}
          pathWidth={2}
        />
        <div className="mt-4 rounded-lg border bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground">1d change</div>
          <div className={`text-lg font-semibold ${change1d >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {change1d >= 0 ? "+" : ""}{change1d.toFixed(2)}%
          </div>
        </div>
        <Card className="mt-4 space-y-2">
          <Label className="text-sm font-medium" htmlFor="amount">Amount (USD)</Label>
          
          <Input type="number" placeholder="0" />
        </Card>
        <Button className="mt-4 w-full">Sign up to trade</Button>
      </div>
    </div>
  );
}
