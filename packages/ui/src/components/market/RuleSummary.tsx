"use client";

import * as React from "react";

export function RuleSummary({ text }: { text?: string }) {
  if (!text) return <p className="text-sm text-muted-foreground">No rules provided.</p>;
  return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
}
