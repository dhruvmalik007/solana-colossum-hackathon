"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { H2 } from "../ui/typography";

/**
 * Articles
 * Displays a small grid of recent articles/resources.
 */
export function Articles(): React.ReactElement {
  const posts = [
    {
      title: "Distributional Markets on Solana",
      desc: "Overview of continuous-outcome markets and core mechanics.",
      href: "/docs",
      image: "/introducing.png",
    },
    {
      title: "Hybrid Order Book & AMM",
      desc: "Routing and best execution across CLOB and CFMM.",
      href: "/docs",
      image: "/dashboard.png",
    },
    {
      title: "Oracles and Resolution",
      desc: "Data sources, governance, and post-resolution flows.",
      href: "/docs",
      image: "/dashboard.png",
    },
  ] as const;

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-6">
      <H2>Latest Articles</H2>
      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((p) => (
          <a key={p.title} href={p.href} className="hover:no-underline">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">{p.title}</CardTitle>
                <CardDescription>{p.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted" />
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}
