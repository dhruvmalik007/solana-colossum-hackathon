"use client";

import React from "react";
// Try to import react bindings from anza kit; if not available, gracefully noop
let SolanaReact = {};
try {
  // Dynamically require to avoid build-time failures if package shape differs
  SolanaReact = require("@solana/react");
} catch (_) {
  SolanaReact = {};
}

// You can extend this to pass endpoint/cluster if needed.
// For now we rely on defaults; later we can read from env.
export function SolanaProviders({ children }: { children: React.ReactNode }) {
  const Provider = (SolanaReact as any)?.SolanaProvider as React.ComponentType<any> | undefined;
  if (Provider) return <Provider>{children}</Provider>;
  return <>{children}</>;
}
