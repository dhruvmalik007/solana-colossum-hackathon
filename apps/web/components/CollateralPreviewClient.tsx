"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

type Props = {
  currentMu: number;
  currentSigma: number;
  proposedMu: number;
  proposedSigma: number;
  volume: number;
};

// Discretized collateral estimation per MATHEMATICAL_FRAMEWORK.md
function estimateCollateral(
  mu0: number, sigma0: number,
  mu1: number, sigma1: number,
  N = 128
): number {
  // Domain: [mu - 6*sigma, mu + 6*sigma] for both distributions
  const a0 = mu0 - 6 * sigma0;
  const b0 = mu0 + 6 * sigma0;
  const a1 = mu1 - 6 * sigma1;
  const b1 = mu1 + 6 * sigma1;
  const a = Math.min(a0, a1);
  const b = Math.max(b0, b1);
  const dx = (b - a) / N;
  
  // Gaussian PDF
  const phi = (x: number, mu: number, sigma: number) => {
    const coef = 1 / (sigma * Math.sqrt(2 * Math.PI));
    const exp = Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
    return coef * exp;
  };
  
  // L2 norm for scaling
  const l2norm = (sigma: number) => 1 / (2 * sigma * Math.sqrt(Math.PI));
  const lambda0 = 1 / l2norm(sigma0); // k=1 for simplicity
  const lambda1 = 1 / l2norm(sigma1);
  
  // Discretized difference
  let minDiff = Infinity;
  for (let i = 0; i < N; i++) {
    const x = a + (i + 0.5) * dx;
    const f0 = lambda0 * phi(x, mu0, sigma0);
    const f1 = lambda1 * phi(x, mu1, sigma1);
    const diff = f1 - f0;
    if (diff < minDiff) minDiff = diff;
  }
  
  // Collateral = -min(g - f)
  return minDiff < 0 ? -minDiff : 0;
}

export default function CollateralPreviewClient(props: Props) {
  const { currentMu, currentSigma, proposedMu, proposedSigma, volume } = props;
  
  const collateral = React.useMemo(() => {
    if (!isFinite(proposedMu) || !isFinite(proposedSigma) || proposedSigma <= 0) return 0;
    return estimateCollateral(currentMu, currentSigma, proposedMu, proposedSigma) * volume;
  }, [currentMu, currentSigma, proposedMu, proposedSigma, volume]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Collateral Required</CardTitle>
        <CardDescription>Estimated based on discretized distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current μ, σ:</span>
            <span className="font-mono">{currentMu.toFixed(2)}, {currentSigma.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Proposed μ, σ:</span>
            <span className="font-mono">{proposedMu.toFixed(2)}, {proposedSigma.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-mono">{volume}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Collateral:</span>
            <span className="font-mono">{collateral.toFixed(4)} USDC</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
