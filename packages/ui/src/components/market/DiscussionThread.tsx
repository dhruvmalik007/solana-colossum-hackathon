"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export type CommentItem = {
  id: string;
  marketId: string;
  userId: string;
  parentId?: string;
  text: string;
  votes: number;
  createdAt: string;
};

export function DiscussionThread({ marketId, userId = "anonymous" }: { marketId: string; userId?: string }) {
  const [items, setItems] = React.useState<CommentItem[]>([]);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/comments?marketId=${encodeURIComponent(marketId)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const body = await res.json();
      setItems(Array.isArray(body?.data) ? body.data : []);
    } catch (e: any) {
      setError(e?.message ?? "error");
    }
  }, [marketId]);

  React.useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marketId, text: t, userId }) });
      if (!res.ok) throw new Error(`post ${res.status}`);
      setText("");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "error");
    } finally {
      setLoading(false);
    }
  };

  const vote = async (id: string, dir: 1 | -1) => {
    try {
      await fetch(`/api/comments/${encodeURIComponent(id)}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dir }) });
      await load();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea placeholder="Write a comment…" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex justify-end">
          <Button onClick={submit} disabled={loading || !text.trim()}>Post</Button>
        </div>
      </div>
      {error ? <div className="text-sm text-rose-600">{String(error)}</div> : null}
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground mb-1">{new Date(c.createdAt).toLocaleString()} • {c.userId}</div>
            <div className="text-sm whitespace-pre-wrap mb-2">{c.text}</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <button className="hover:text-foreground" onClick={() => vote(c.id, 1)}>▲</button>
              <span>{c.votes ?? 0}</span>
              <button className="hover:text-foreground" onClick={() => vote(c.id, -1)}>▼</button>
            </div>
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet.</p> : null}
      </div>
    </div>
  );
}
