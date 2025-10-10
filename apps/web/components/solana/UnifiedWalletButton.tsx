"use client";

import * as React from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { useWalletIdentity } from "./useWalletIdentity";

function truncate(pk?: string) {
  if (!pk) return "";
  return pk.length > 12 ? `${pk.slice(0, 4)}…${pk.slice(-4)}` : pk;
}

export function UnifiedWalletButton() {
  const id = useWalletIdentity();
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onConnect() {
    setErr(null); setBusy(true);
    try { await id.connect?.(); } catch (e: any) { setErr(e?.message ?? "Failed to connect"); } finally { setBusy(false); }
  }

  async function onDisconnect() {
    setErr(null); setBusy(true);
    try { await id.disconnect?.(); } catch (e: any) { setErr(e?.message ?? "Failed to disconnect"); } finally { setBusy(false); }
  }

  if (busy) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Spinner className="mr-2 h-4 w-4" /> Loading…
      </Button>
    );
  }

  if (!id.connected) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onConnect}>Connect</Button>
        {err ? <span className="text-xs text-rose-500">{err}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onDisconnect}>
        {truncate(id.publicKey)}
      </Button>
      <span className="text-[11px] text-muted-foreground">{id.source}</span>
      {err ? <span className="text-xs text-rose-500">{err}</span> : null}
    </div>
  );
}
