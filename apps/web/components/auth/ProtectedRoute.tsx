"use client";

import React, { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }): React.ReactNode {
  const { authenticated, isModalOpen } = usePrivy();
  const router = useRouter();
  const [bootWait, setBootWait] = React.useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBootWait(false), 800); // allow session to hydrate on refresh
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!bootWait && !isModalOpen && !authenticated) {
      router.push("/login");
    }
  }, [authenticated, isModalOpen, router, bootWait]);

  if (isModalOpen || bootWait) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
