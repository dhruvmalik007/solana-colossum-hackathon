"use client";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui-bridge";
import { Button } from "../../components/ui-bridge";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { CopilotSidebarClient } from "../../components/CopilotSidebarClient";
import { CopilotKit } from "@copilotkit/react-core";

export default function AgentsPage() {
  const [userId, setUserId] = useState("");
  const [marketId, setMarketId] = useState("");
  const [threadId, setThreadId] = useState("");
  const [payload, setPayload] = useState("");
  const [indexRes, setIndexRes] = useState<any>(null);
  const [open, setOpen] = useState(true);

  const [q, setQ] = useState("");
  const [searchRes, setSearchRes] = useState<any>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // Auto-load accessible memory on mount (default query)
  useEffect(() => {
    // do not block UI; fire and forget
    void onSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onIndex() {
    try {
      const res = await fetch(`${apiBase}/api/memory/index`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "discussion",
          userId: userId || "anonymous",
          marketId: marketId || undefined,
          threadId: threadId || undefined,
          payload: payload ? tryParse(payload) : { text: "hello world" },
          options: { enableGraph: true },
        }),
      });
      const j = await res.json();
      setIndexRes(j);
      if (j?.threadId) setThreadId(j.threadId);
    } catch (e) {
      setIndexRes({ error: String(e) });
    }
  }

  async function onSearch() {
    try {
      const params = new URLSearchParams({ q: q || "recent", limit: "5", rerank: "1", enableGraph: "0" });
      if (userId) params.set("userId", userId);
      if (threadId) params.set("runId", threadId);
      const res = await fetch(`${apiBase}/api/memory/search?` + params.toString());
      const j = await res.json();
      setSearchRes(j);
    } catch (e) {
      setSearchRes({ error: String(e) });
    }
  }

  return (
    <ProtectedRoute>
      <CopilotKit runtimeUrl="/api/copilotkit">
        <div className="max-w-3xl mx-auto p-4">
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Agent</CardTitle>
              <CardDescription>Index discussions and search accessible memory</CardDescription>
            </div>
            <Button variant="secondary" onClick={() => setOpen((v) => !v)}>{open ? "Collapse" : "Expand"}</Button>
          </CardHeader>
          {open && (
            <CardContent className="space-y-6">
              <div className="border rounded p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Copilot</div>
                  <div className="text-xs text-muted-foreground">Side panel</div>
                </div>
                <CopilotSidebarClient labels={{ title: "Agent", initial: "How can I help with your market portfolio?" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="userId" value={userId} onChange={(e) => setUserId(e.target.value)} />
                <Input placeholder="marketId (optional)" value={marketId} onChange={(e) => setMarketId(e.target.value)} />
                <Input placeholder="threadId (optional)" value={threadId} onChange={(e) => setThreadId(e.target.value)} />
                <div className="col-span-2">
                  <Textarea rows={4} placeholder="payload JSON or text" value={payload} onChange={(e) => setPayload(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={onIndex}>Index</Button>
                <Button variant="outline" onClick={onSearch}>Search</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <pre className="bg-gray-50 p-2 text-xs overflow-auto rounded border"><strong>Index Result</strong>\n{JSON.stringify(indexRes, null, 2)}</pre>
                <pre className="bg-gray-50 p-2 text-xs overflow-auto rounded border"><strong>Search Result</strong>\n{JSON.stringify(searchRes, null, 2)}</pre>
              </div>
            </CardContent>
          )}
          </Card>
        </div>
      </CopilotKit>
    </ProtectedRoute>
  );
}

function tryParse(s: string): any {
  try { return JSON.parse(s); } catch { return s; }
}
