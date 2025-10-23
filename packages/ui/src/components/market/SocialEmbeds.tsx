"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export type EmbedItem = {
  id: string;
  marketId: string;
  url: string;
  source: string;
  html?: string;
  createdAt: string;
};

export function SocialEmbeds({ marketId }: { marketId: string }) {
  const [items, setItems] = React.useState<EmbedItem[]>([]);
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/embeds?marketId=${encodeURIComponent(marketId)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const body = await res.json();
      setItems(Array.isArray(body?.data) ? body.data : []);
    } catch (e: any) {
      setError(e?.message ?? "error");
    }
  }, [marketId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!url.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/embeds`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marketId, url }) });
      if (!res.ok) throw new Error(`post ${res.status}`);
      setUrl("");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Paste Bluesky/X/Instagram URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button onClick={submit} disabled={loading}>Add</Button>
      </div>
      {error ? <div className="text-sm text-rose-600">{String(error)}</div> : null}
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground mb-2">{new Date(it.createdAt).toLocaleString()} • {it.source.toUpperCase()}</div>
            {it.html ? (
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: it.html }} />
            ) : (
              <a href={it.url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{it.url}</a>
            )}
          </div>
        ))}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No embeds yet.</p>
        ) : null}
      </div>
    </div>
  );
}
