"use client";

import * as React from "react";

/**
 * H1
 * Semantic heading styled per shadcn/ui conventions for prominent titles.
 */
export function H1({ children }: { children: React.ReactNode }): React.ReactElement {
  return <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight lg:text-5xl">{children}</h1>;
}

/**
 * H2
 * Section heading used across landing sections.
 */
export function H2({ children }: { children: React.ReactNode }): React.ReactElement {
  return <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">{children}</h2>;
}

/**
 * Lead
 * Lead paragraph for hero/section subtitles.
 */
export function Lead({ children }: { children: React.ReactNode }): React.ReactElement {
  return <p className="text-lg text-muted-foreground">{children}</p>;
}
