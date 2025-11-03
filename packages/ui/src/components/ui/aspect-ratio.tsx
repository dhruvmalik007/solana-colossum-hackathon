"use client";

import * as React from "react";

/**
 * AspectRatio
 * Lightweight aspect-ratio wrapper that uses CSS `aspect-ratio` to
 * preserve media dimensions (e.g., videos, images).
 *
 * Props:
 * - ratio: number (e.g., 16/9)
 * - children: React.ReactNode rendered inside a relatively positioned box
 */
export function AspectRatio({ ratio = 16 / 9, children }: { ratio?: number; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: String(ratio) }}>
      <div className="absolute inset-0 h-full w-full">{children}</div>
    </div>
  );
}
