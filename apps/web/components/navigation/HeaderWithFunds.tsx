"use client";
import * as React from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { Header } from "@repo/ui/components/ui/header";
import { UnifiedWalletButton } from "../solana/UnifiedWalletButton";
import { API_BASE } from "@/lib/client/api";

export function HeaderWithFunds(): React.ReactNode {
  const { user, authenticated } = usePrivy();
  const [showFunds, setShowFunds] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    async function check() {
      try {
        if (!authenticated || !user?.id) { setShowFunds(false); return; }
        const res = await fetch(`${API_BASE}/creator-profiles/${user.id}`);
        const out = await res.json().catch(() => ({}));
        if (!alive) return;
        if (res.ok) {
          const role = out?.data?.role as string | undefined;
          setShowFunds(role === "creator" || role === "participant" || role === "both");
        } else {
          setShowFunds(false);
        }
      } catch {
        if (alive) setShowFunds(false);
      }
    }
    check();
    return () => { alive = false; };
  }, [authenticated, user?.id]);

  const right = (
    <div className="flex items-center gap-2">
      {showFunds && (
        <Link href="/funds" className="text-sm text-foreground hover:underline">
          Funds
        </Link>
      )}
      <UnifiedWalletButton />
    </div>
  );

  return <Header rightSlot={right} />;
}
