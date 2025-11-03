"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

/**
 * Pricing
 * Displays 3 SaaS pricing tiers styled with shadcn/ui.
 */
export function Pricing(): React.ReactElement {
  const tiers = [
    {
      name: "Builder",
      price: "$19",
      period: "/ month",
      features: [
        "1 creator seat",
        "Up to 5 markets",
        "Gaussian distributions",
        "Manual oracle resolution",
      ],
      cta: "Subscribe",
      featured: false,
    },
    {
      name: "Pro (Popular)",
      price: "$49",
      period: "/ month",
      features: [
        "Up to 5 creator seats",
        "Unlimited markets",
        "Hybrid AMM + CLOB routing",
        "Oracle integrations (Pyth/Chainlink)",
        "Priority support",
      ],
      cta: "Subscribe",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Contact",
      period: "",
      features: [
        "Unlimited seats",
        "Custom integrations & analytics",
        "SLAs and dedicated support",
        "Advanced market types",
      ],
      cta: "Contact Sales",
      featured: false,
    },
  ] as const;

  return (
    <section id="pricing" className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Pricing</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <Card key={t.name} className={t.featured ? "border-primary" : undefined}>
            <CardHeader>
              <CardTitle>{t.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-semibold">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.period}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {t.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant={t.featured ? "default" : "outline"} className="w-full">{t.cta}</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
