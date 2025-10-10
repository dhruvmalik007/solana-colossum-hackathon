"use client";

import React from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { PrivyProvider, useActiveWallet } from "@privy-io/react-auth";

function truncate(pubkey: string) {
  return pubkey.length > 10 ? `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}` : pubkey;
}

export function WalletConnectButton() {
  const { wallet, connect } = useActiveWallet();
  const [error, setError] = React.useState<string | null>(null);

  async function onConnect() {
    setError(null);
    try {
      // Prefer first available wallet if none selected
      const target = wallet?.address;
      if (target) {
        await connect();
      } else {
        // Some Wallet Standard providers allow connect() without args
        await connect();
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to connect wallet");
    }
  }

  async function onDisconnect() {
    setError(null);
    try {
      //await disconnect();
    } catch (e: any) {
      setError(e?.message ?? "Failed to disconnect");
    }
  }

  if (wallet) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Spinner className="mr-2 h-4 w-4" /> Connecting…
      </Button>
    );
  }

//  if () {
//    return (
//      <div className="flex items-center gap-2">
//        <Button variant="outline" size="sm" onClick={onDisconnect}>
//          {truncate(wallet.publicKey.toString())}
//        </Button>
//        {error ? <span className="text-xs text-rose-500">{error}</span> : null}
//      </div>
//    );
//  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="default" size="sm" onClick={onConnect}>Connect Wallet</Button>
      {error ? <span className="text-xs text-rose-500">{error}</span> : null}
    </div>
  );
}
