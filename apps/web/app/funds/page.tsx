"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { FiltersBar } from "@repo/ui/components/funds/FiltersBar";
import { FundTable } from "@repo/ui/components/funds/FundTable";
import { FundsSkeleton } from "@repo/ui/components/funds/FundsSkeleton";
import type { CreatorFund } from "@repo/ui/components/funds/FundRow";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { API_BASE } from "@/lib/client/api";

export default function FundsPage(): React.ReactNode {
  return (
    <ProtectedRoute>
      <FundsContent />
    </ProtectedRoute>
  );
}

function FundsContent(): React.ReactNode {
  const { user } = usePrivy();
  const router = useRouter();

  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<CreatorFund[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [gate, setGate] = React.useState<"checking" | "blocked" | "ok">("checking");

  React.useEffect(() => {
    let alive = true;
    async function checkGate() {
      try {
        if (!user?.id) { setGate("blocked"); return; }
        const res = await fetch(`${API_BASE}/creator-profiles/${user.id}`);
        if (!alive) return;
        if (res.ok) {
          const data = await res.json();
          const role = data?.data?.role as string | undefined;
          if (role === "creator" || role === "participant" || role === "both") setGate("ok");
          else setGate("blocked");
        } else {
          setGate("blocked");
        }
      } catch {
        setGate("blocked");
      }
    }
    checkGate();
    return () => { alive = false; };
  }, [user?.id]);

  // Fetch list
  React.useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${API_BASE}/creator-profiles?page=${page}&pageSize=20${q ? `&q=${encodeURIComponent(q)}` : ""}`);
        const out = await res.json();
        if (!alive) return;
        if (!res.ok) throw new Error(out?.error || `fetch ${res.status}`);
        setItems(out?.data ?? []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load funds");
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [q, page]);

  if (gate !== "ok") {
    return (
      <div className="mx-auto max-w-5xl p-4 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Creator Funds</h1>
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Funds are available to onboarded creators or participants.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button onClick={() => router.push("/creator-onboarding")}>Complete Onboarding</Button>
              <Button variant="outline" onClick={() => router.push("/login")}>Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Creator Funds</h1>
      </div>
      <FiltersBar q={q} onChange={(v) => { setPage(1); setQ(v); }} />

      {loading ? (
        <FundsSkeleton />
      ) : error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      ) : (
        <FundTable items={items} onRowClick={(id) => router.push(`/funds/${id}`)} />
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
        <div className="text-sm text-muted-foreground">Page {page}</div>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={items.length < 20}>Next</Button>
      </div>
    </div>
  );
}
