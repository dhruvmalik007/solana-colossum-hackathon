"use client";

import * as React from "react";
import { Stepper } from "@repo/ui/components/Stepper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Label } from "@repo/ui/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectValue } from "@repo/ui/components/ui/select";
import { Button } from "@repo/ui/components/ui/button";
import { TxnStatus, type TxStatusState } from "@repo/ui/components/TxnStatus";

const steps = [
  { id: "type", label: "Market Type" },
  { id: "event", label: "Event Details" },
  { id: "dist", label: "Distribution" },
  { id: "oracle", label: "Oracle" },
  { id: "economics", label: "Economics" },
  { id: "review", label: "Review & Deploy" },
];

export default function CreateMarketPage() {
  const [current, setCurrent] = React.useState(0);
  const [status, setStatus] = React.useState<TxStatusState>({ stage: "idle" });

  // Minimal form state (MVP) — extend per spec
  const [marketType, setMarketType] = React.useState<string>("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [rangeMin, setRangeMin] = React.useState<string>("");
  const [rangeMax, setRangeMax] = React.useState<string>("");
  const [oracleType, setOracleType] = React.useState<string>("");
  const [liquidity, setLiquidity] = React.useState<string>("");

  const canNext = React.useMemo(() => {
    switch (current) {
      case 0:
        return !!marketType;
      case 1:
        return title.trim().length >= 10 && description.trim().length >= 50;
      case 2:
        return rangeMin !== "" && rangeMax !== "" && Number(rangeMax) > Number(rangeMin);
      case 3:
        return !!oracleType;
      case 4:
        return liquidity !== "" && Number(liquidity) > 0;
      default:
        return true;
    }
  }, [current, marketType, title, description, rangeMin, rangeMax, oracleType, liquidity]);

  async function onDeploy() {
    try {
      setStatus({ stage: "signing" });
      // TODO: integrate @solana/kit transaction to create_distributional_market
      await new Promise((r) => setTimeout(r, 800));
      setStatus({ stage: "submitting", signature: undefined });
      await new Promise((r) => setTimeout(r, 800));
      setStatus({ stage: "confirming", signature: "pending", confirmations: 2, target: 32 });
      await new Promise((r) => setTimeout(r, 800));
      setStatus({ stage: "finalized", signature: "demo-signature" });
    } catch (e: any) {
      setStatus({ stage: "error", message: e?.message ?? "Deployment failed" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Market</h1>
        <p className="text-sm text-muted-foreground">Six-step guided flow per spec.</p>
      </div>

      <Stepper steps={steps} currentStep={current} onStepChange={setCurrent} />

      {current === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Market Type</CardTitle>
            <CardDescription>Select the market type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Type</Label>
            <Select value={marketType} onValueChange={setMarketType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1 text-sm">Distributional</div>
                <div className="px-2 py-1 text-sm">Binary</div>
                <div className="px-2 py-1 text-sm">Categorical</div>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {current === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Title and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What will BTC price be on Dec 31, 2025?" />
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide context and resolution criteria…" />
          </CardContent>
        </Card>
      )}

      {current === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution</CardTitle>
            <CardDescription>Outcome range (MVP)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="min">Min</Label>
              <Input id="min" type="number" value={rangeMin} onChange={(e) => setRangeMin(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="max">Max</Label>
              <Input id="max" type="number" value={rangeMax} onChange={(e) => setRangeMax(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {current === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Oracle</CardTitle>
            <CardDescription>Select resolution source</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Type</Label>
            <Select value={oracleType} onValueChange={setOracleType}>
              <SelectTrigger>
                <SelectValue placeholder="Select oracle" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1 text-sm">Manual</div>
                <div className="px-2 py-1 text-sm">Chainlink</div>
                <div className="px-2 py-1 text-sm">Pyth</div>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {current === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Economics</CardTitle>
            <CardDescription>Initial liquidity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="liq">Initial Liquidity (USDC)</Label>
            <Input id="liq" type="number" value={liquidity} onChange={(e) => setLiquidity(e.target.value)} />
          </CardContent>
        </Card>
      )}

      {current === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Deploy</CardTitle>
            <CardDescription>Confirm parameters and deploy to Solana</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">Type: <span className="text-muted-foreground">{marketType || "-"}</span></div>
            <div className="text-sm">Title: <span className="text-muted-foreground">{title || "-"}</span></div>
            <div className="text-sm">Range: <span className="text-muted-foreground">{rangeMin || "-"} – {rangeMax || "-"}</span></div>
            <div className="text-sm">Oracle: <span className="text-muted-foreground">{oracleType || "-"}</span></div>
            <div className="text-sm">Liquidity: <span className="text-muted-foreground">{liquidity || "-"} USDC</span></div>
            <TxnStatus state={status} />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))}>Back</Button>
        {current < steps.length - 1 ? (
          <Button disabled={!canNext} onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}>Continue</Button>
        ) : (
          <Button onClick={onDeploy}>Deploy Market</Button>
        )}
      </div>
    </div>
  );
}
