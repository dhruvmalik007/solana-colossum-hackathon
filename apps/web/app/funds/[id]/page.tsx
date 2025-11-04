"use client";
import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { MetricCard } from "@repo/ui/components/funds/MetricCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/components/ui/tabs";
import { Badge } from "@repo/ui/components/ui/badge";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import type { CreatorFund } from "@repo/ui/components/funds/FundRow";
import { API_BASE } from "@/lib/client/api";

function short(addr?: string) {
  if (!addr) return "";
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export default function FundDetailPage(): React.ReactNode {
  return (
    <ProtectedRoute>
      <DetailContent />
    </ProtectedRoute>
  );
}

function DetailContent(): React.ReactNode {
  const { id } = useParams<{ id: string }>() as { id: string };
  const { user } = usePrivy();
  const router = useRouter();

  const [data, setData] = React.useState<CreatorFund | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${API_BASE}/creator-profiles/${id}`);
        const out = await res.json();
        if (!alive) return;
        if (!res.ok) throw new Error(out?.error || `fetch ${res.status}`);
        setData(out?.data ?? null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load fund");
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (id) run();
    return () => { alive = false; };
  }, [id]);

  if (error) {
    return <div className="mx-auto max-w-5xl p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded">{error}</div>;
  }

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-6xl p-4 space-y-4">
        <div className="h-24 rounded-lg border animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 rounded-lg border animate-pulse" />
          <div className="h-24 rounded-lg border animate-pulse" />
          <div className="h-24 rounded-lg border animate-pulse" />
        </div>
      </div>
    );
  }

  const name = data.profileData?.displayName || short(data.walletAddress);

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded bg-muted" aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="text-xl font-semibold truncate">{name}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{short(data.walletAddress)}</span>
                <Badge variant="secondary" className="rounded-full">{data.role}</Badge>
                <Badge variant={data.verificationStatus === "verified" ? "default" : "secondary"} className="rounded-full capitalize">{data.verificationStatus}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Current value" value={typeof data.portfolioStats?.solBalance === 'number' ? `$${data.portfolioStats.solBalance.toLocaleString()}` : "—"} hint="USDC + active positions (placeholder)" />
        <MetricCard label="Total deposits" value={typeof data.portfolioStats?.totalVolume === 'number' ? `$${data.portfolioStats.totalVolume.toLocaleString()}` : "—"} hint="Starting + subsequent deposits" />
        <MetricCard label="Profit" value={"—"} hint="Performance (placeholder)" />
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="performance">Fund Performance</TabsTrigger>
          <TabsTrigger value="your">Your Performance</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="performance">
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">Chart and summary coming soon.</div>
        </TabsContent>
        <TabsContent value="your">
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">Your positions and ROI will appear here.</div>
        </TabsContent>
        <TabsContent value="predictions">
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">Predictions table placeholder.</div>
        </TabsContent>
        <TabsContent value="orders">
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">Orders table placeholder.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
