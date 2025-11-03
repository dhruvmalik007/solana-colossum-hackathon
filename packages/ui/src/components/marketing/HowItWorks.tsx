"use client";

import * as React from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

/**
 * HowItWorks
 * Shows a simple 3-step flow explaining the core experience.
 * Defaults are tailored to distributional prediction markets.
 */
export function HowItWorks(): React.ReactElement {
  const steps: { title: string; body: string }[] = [
    {
      title: "Create or Discover Markets",
      body:
        "Creators propose questions and market parameters; participants browse curated lists and categories.",
    },
    {
      title: "Trade Distributions",
      body:
        "Express beliefs as continuous distributions and route orders via AMM or order book for best execution.",
    },
    {
      title: "Resolve & Analyze",
      body:
        "Oracles or governance resolve outcomes. Historical snapshots and on-chain data power analytics.",
    },
  ];

  return (
    <section className="rounded-2xl border bg-white p-6">
      <Badge variant="secondary">How it works</Badge>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-4">
              <div className="text-sm font-medium">{s.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
