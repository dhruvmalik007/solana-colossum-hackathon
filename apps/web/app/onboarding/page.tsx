"use client";

import * as React from "react";
import { Stepper } from "@repo/ui/components/Stepper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { TxnStatus } from "@repo/ui/components/TxnStatus";
import { WalletConnectButton } from "../../components/solana/WalletConnectButton";
import { useSendMemoTx } from "../../components/solana/useSendMemoTx";

const steps = [
  { id: "wallet", label: "Connect" },
  { id: "market", label: "Pick Market" },
  { id: "design", label: "Design Prediction" },
  { id: "size", label: "Size Position" },
  { id: "confirm", label: "Confirm & Trade" },
];

export default function InvestorOnboardingPage(): any {
  const [current, setCurrent] = React.useState(0);
  const [memo, setMemo] = React.useState("hello-predict");
  const { state, sendMemo } = useSendMemoTx();

  const canNext = React.useMemo(() => {
    switch (current) {
      case 0:
        return true; // wallet connect handled by button
      case 1:
        return true; // MVP - market selection later
      case 2:
        return true; // MVP
      case 3:
        return true; // MVP
      default:
        return true;
    }
  }, [current]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Investor Onboarding</h1>
        <p className="text-sm text-muted-foreground">Guided flow to place your first trade.</p>
      </div>

      <Stepper steps={steps} currentStep={current} onStepChange={setCurrent} />

      {current === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Select a wallet using Anza's Solana kit</CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnectButton />
          </CardContent>
        </Card>
      )}

      {current === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Pick a Market</CardTitle>
            <CardDescription>MVP placeholder - choose from markets list</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Select any market from the Markets page to proceed.</p>
          </CardContent>
        </Card>
      )}

      {current === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Design Prediction</CardTitle>
            <CardDescription>MVP placeholder - distribution editor will be here</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Use templates, parameters, or freeform editor (coming soon).</p>
          </CardContent>
        </Card>
      )}

      {current === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Size Position</CardTitle>
            <CardDescription>Set your trade size</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="memo">Demo memo (tx note)</Label>
            <Input id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </CardContent>
        </Card>
      )}

      {current === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm & Trade</CardTitle>
            <CardDescription>Sends a demo memo transaction to verify wallet + flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <TxnStatus state={state} />
            <div className="flex justify-end">
              <Button onClick={() => sendMemo(memo)}>Send Demo Tx</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))}>Back</Button>
        <Button disabled={!canNext || current === steps.length - 1} onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}>Continue</Button>
      </div>
    </div>
  );
}
