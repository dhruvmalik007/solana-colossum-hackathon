"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { Stepper } from "@repo/ui/components/Stepper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import type { CreatorRole, CreatorOnboardingStep, PortfolioData } from "../../lib/types/creator";
import { API_BASE } from "@/lib/client/api";

const steps = [
  { id: "role-select", label: "Select Role" },
  { id: "portfolio-connect", label: "Connect Portfolio" },
  { id: "credentials-verify", label: "Verify Credentials" },
  { id: "profile-setup", label: "Profile Setup" },
  { id: "complete", label: "Complete" },
];

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [current, setCurrent] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [role, setRole] = React.useState<CreatorRole>("both");
  const [portfolioData, setPortfolioData] = React.useState<PortfolioData | null>(null);
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [website, setWebsite] = React.useState("");

  const primaryWallet = wallets?.[0];

  const canNext = React.useMemo(() => {
    switch (current) {
      case 0:
        return !!role;
      case 1:
        return !!portfolioData;
      case 2:
        return true;
      case 3:
        return displayName.trim().length >= 3 && bio.trim().length >= 20;
      default:
        return true;
    }
  }, [current, role, portfolioData, displayName, bio]);

  async function fetchPortfolioData() {
    if (!primaryWallet) {
      setError("No wallet connected");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/portfolio`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ walletAddress: primaryWallet.address }),
      });

      if (!res.ok) throw new Error(`Portfolio fetch failed: ${res.status}`);
      const data = await res.json();
      setPortfolioData(data.data);
      setCurrent(2);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch portfolio data");
    } finally {
      setLoading(false);
    }
  }

  async function onComplete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/creator-profile`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          walletAddress: primaryWallet?.address,
          role,
          displayName,
          bio,
          website,
          portfolioStats: portfolioData ? {
            totalMarketsCreated: 0,
            totalVolume: portfolioData.tokenHoldings.reduce((sum, t) => sum + t.value, 0),
            successRate: 0,
            averageAccuracy: 0,
          } : undefined,
        }),
      });

      if (!res.ok) throw new Error(`Profile creation failed: ${res.status}`);
      router.push("/markets");
    } catch (e: any) {
      setError(e?.message ?? "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-2">Set up your profile and verify your credentials</p>
        </div>

        <Stepper steps={steps} currentStep={current} onStepChange={setCurrent} />

        {current === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Your Role</CardTitle>
              <CardDescription>Choose how you want to participate in prediction markets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(['creator', 'participant', 'both'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    role === r ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                  }`}
                >
                  <div className="font-semibold">{r.charAt(0).toUpperCase() + r.slice(1)}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {r === 'creator' && 'Create and manage prediction markets'}
                    {r === 'participant' && 'Trade and participate in markets'}
                    {r === 'both' && 'Create markets and trade'}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {current === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Portfolio</CardTitle>
              <CardDescription>Verify your on-chain credentials and experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-semibold">Connected Wallet</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono break-all">{primaryWallet?.address}</div>
              </div>
              <p className="text-sm text-muted-foreground">
                We'll analyze your wallet to verify your experience with DeFi protocols and trading history.
              </p>
              <Button onClick={fetchPortfolioData} disabled={loading || !primaryWallet} className="w-full">
                {loading ? "Analyzing Portfolio..." : "Fetch Portfolio Data"}
              </Button>
              {error && <div className="text-xs text-rose-500">{error}</div>}
            </CardContent>
          </Card>
        )}

        {current === 2 && portfolioData && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Verification</CardTitle>
              <CardDescription>Your on-chain credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">SOL Balance</div>
                  <div className="text-lg font-semibold">{portfolioData.solBalance.toFixed(2)} SOL</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Token Holdings</div>
                  <div className="text-lg font-semibold">{portfolioData.tokenHoldings.length}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">NFTs</div>
                  <div className="text-lg font-semibold">{portfolioData.nftHoldings}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Total Portfolio Value</div>
                  <div className="text-lg font-semibold">
                    ${(portfolioData.solBalance * 200 + portfolioData.tokenHoldings.reduce((sum, t) => sum + t.value, 0)).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-900 dark:text-green-100">✓ Portfolio verified successfully</div>
              </div>
            </CardContent>
          </Card>
        )}

        {current === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>Add personal information to your creator profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your experience with prediction markets and DeFi..."
                  className="mt-1 min-h-24"
                />
              </div>
              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1"
                  type="url"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {current === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Complete!</CardTitle>
              <CardDescription>Your profile is ready</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-900 dark:text-green-100">
                  ✓ Your creator profile has been set up successfully. You can now create and manage prediction markets.
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div><strong>Role:</strong> {role.charAt(0).toUpperCase() + role.slice(1)}</div>
                <div><strong>Display Name:</strong> {displayName}</div>
                <div><strong>Wallet:</strong> <span className="font-mono text-xs">{primaryWallet?.address}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && current < 4 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950 rounded-lg border border-rose-200 dark:border-rose-800">
            <div className="text-sm text-rose-900 dark:text-rose-100">{error}</div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={current === 0 || loading}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            Back
          </Button>
          {current < steps.length - 1 ? (
            <Button
              disabled={!canNext || loading}
              onClick={() => {
                if (current === 1) {
                  fetchPortfolioData();
                } else {
                  setCurrent((c) => Math.min(steps.length - 1, c + 1));
                }
              }}
            >
              {loading ? "Loading..." : "Continue"}
            </Button>
          ) : (
            <Button onClick={onComplete} disabled={loading}>
              {loading ? "Completing..." : "Go to Markets"}
            </Button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
