"use client";

import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

export function LineBar({
  value,
  color = "emerald",
  align = "right",
  height = 6,
  className,
  secondary,
}: {
  value: number; // 0..1
  color?: "emerald" | "rose" | "sky" | "zinc" | string;
  align?: "left" | "right";
  height?: number;
  className?: string;
  secondary?: { value: number; color?: string };
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const spct = Math.max(0, Math.min(1, secondary?.value ?? 0)) * 100;
  const base = colorClass(color);
  const sec = colorClass(secondary?.color || (color === "rose" ? "emerald" : "rose"));
  return (
    <div className={cn("relative w-full overflow-hidden rounded-sm", className)} style={{ height }}>
      <div
        className={cn("absolute inset-y-0", align === "right" ? "right-0" : "left-0", base.bg)}
        style={{ width: `${pct}%` }}
      />
      {secondary && secondary.value > 0 ? (
        <div
          className={cn("absolute inset-y-0 opacity-70", align === "right" ? "right-0" : "left-0", sec.bg)}
          style={{ width: `${spct}%` }}
        />
      ) : null}
    </div>
  );
}

function colorClass(c: string | undefined) {
  switch (c) {
    case "emerald":
      return { bg: "bg-emerald-500/30" };
    case "rose":
      return { bg: "bg-rose-500/30" };
    case "sky":
      return { bg: "bg-sky-500/30" };
    case "zinc":
      return { bg: "bg-zinc-500/30" };
    default:
      return { bg: c ? c : "bg-foreground/20" };
  }
}
