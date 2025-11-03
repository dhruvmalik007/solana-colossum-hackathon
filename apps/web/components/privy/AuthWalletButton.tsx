"use client";

import * as React from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { useActiveWallet, usePrivy } from "@privy-io/react-auth";

function truncate(addr?: string) {
  if (!addr) return "";
  return addr.length > 10 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;
}

/**
 * AuthWalletButton
 * - If Privy is authenticating/initializing: show disabled spinner.
 * - If not authenticated: show Login (opens Privy modal).
 * - If authenticated and no active wallet: show Connect Wallet.
 * - If authenticated and wallet connected: show address and Logout.
 */
export function AuthWalletButton(): React.ReactNode {
  const { connect, wallet } = useActiveWallet();
  const { authenticated, ready, login, logout } = usePrivy();

  // Loading/initializing state
  if (!ready) {
    return (
      <Button variant="outline" size="sm" disabled aria-busy>
        <Spinner className="mr-2 h-4 w-4" /> Loading…
      </Button>
    );
  }

  // Not authenticated
  if (!authenticated) {
    return (
      <Button size="sm" onClick={() => login()}>
        Login
      </Button>
    );
  }

  // Authenticated but no wallet yet
  if (!wallet?.address) {
    return (
      <Button size="sm" onClick={() => connect?.()}>
        Connect Wallet
      </Button>
    );
  }

  // Authenticated + wallet connected
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" title={wallet.address}>
        {truncate(wallet.address)}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => logout()}>
        Logout
      </Button>
    </div>
  );
}
