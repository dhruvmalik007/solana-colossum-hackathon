"use client";

import * as React from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { useActiveWallet } from "@privy-io/react-auth";

function truncate(addr?: string) {
  if (!addr) return "";
  return addr.length > 10 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;
}

export function AuthWalletButton() {
  const { connect, setActiveWallet, wallet, network } = useActiveWallet();

  if (!wallet) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Spinner className="mr-2 h-4 w-4" /> Loading…
      </Button>
    );
  }

  if (!wallet) {
    return (
      <Button size="sm" onClick={() => connect?.()}>
        Login
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {wallet?.address ? (
        <Button variant="outline" size="sm" onClick={() => setActiveWallet?.(wallet)}>
          {truncate(wallet.address)}
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setActiveWallet?.(wallet)}>
          {"Logout"}
        </Button>
      )}
    </div>
  );
}
