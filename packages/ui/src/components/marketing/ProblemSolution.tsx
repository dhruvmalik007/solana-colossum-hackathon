"use client";

import * as React from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

/**
 * ProblemSolution
 * Displays a two-part section describing the Problem and the Solution
 * for distributional prediction markets on Solana. Designed to be used
 * on landing pages to communicate value clearly.
 */
export function ProblemSolution(): React.ReactElement {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card className="bg-white">
        <CardHeader>
          <Badge variant="secondary" className="w-max">Problem</Badge>
          <CardTitle className="text-xl">Markets need expressive, continuous outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Most markets capture beliefs as single points. We need distributions to express uncertainty, multimodality, and credible intervals.
            </p>
            <p>
              Execution must remain efficient and transparent while supporting a <strong>hybrid AMM + CLOB</strong> and secure oracle-based resolution.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardHeader>
          <Badge variant="secondary" className="w-max">Solution</Badge>
          <CardTitle className="text-xl">Distributional markets with L² CFMM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              A <strong>distributional prediction marketplace</strong> on Solana built on an L² norm CFMM for continuous outcomes with optional order-book routing for best execution.
            </p>
            <p>
              Integrated oracles, creator/participant workflows, and hourly on-chain snapshots provide discoverability and analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
