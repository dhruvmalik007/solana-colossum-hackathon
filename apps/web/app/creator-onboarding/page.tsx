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
import { Spinner } from "@repo/ui/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/components/ui/tabs";
import { Badge } from "@repo/ui/components/ui/badge";
import { Separator } from "@repo/ui/components/ui/separator";
import { ShineBorder } from "@repo/ui/components/ui/shine-border";
import type { CreatorRole, CreatorOnboardingStep, PortfolioData } from "../../lib/types/creator";
import { API_BASE } from "@/lib/client/api";

const steps = [
  { id: "role-select", label: "Select Role" },
  { id: "portfolio-connect", label: "Connect Portfolio" },
  { id: "credentials-verify", label: "Verify Credentials" },
  { id: "profile-setup", label: "Profile Setup" },
  { id: "complete", label: "Complete" },
];

const ROLES = ["creator", "participant", "both"] as const;
function cycleRole(index: number, delta: number): CreatorRole {
  const len = ROLES.length;
  const next = (index + delta + len) % len;
  return ROLES[next] as CreatorRole;
}

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [current, setCurrent] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [role, setRole] = React.useState<CreatorRole>("creator");
  const [portfolioData, setPortfolioData] = React.useState<PortfolioData | null>(null);
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [website, setWebsite] = React.useState("");

  const primaryWallet = wallets?.[0];

  // Solana wallet (Phantom) detection and connection state
  const [solanaDetected, setSolanaDetected] = React.useState(false);
  const [solanaPubkey, setSolanaPubkey] = React.useState<string | null>(null);
  const [connectingSol, setConnectingSol] = React.useState(false);

  // EVM Safe deployment state
  const [deployingSafe, setDeployingSafe] = React.useState(false);
  const [safeAddress, setSafeAddress] = React.useState<string | null>(null);
  const [activeConnectTab, setActiveConnectTab] = React.useState<"solana" | "safe">("solana");

  const canNext = React.useMemo(() => {
    switch (current) {
      case 0:
        return !!role;
      case 1:
        // Allow proceeding if portfolio fetched OR a Safe has been deployed
        return !!portfolioData || !!safeAddress;
      case 2:
        return true;
      case 3:
        return displayName.trim().length >= 3 && bio.trim().length >= 20;
      default:
        return true;
    }
  }, [current, role, portfolioData, displayName, bio, safeAddress]);

  // Detect Phantom (or compatible) on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as any;
    const provider = w?.solana;
    if (provider && provider.isPhantom) {
      setSolanaDetected(true);
      const handleConnect = () => setSolanaPubkey(provider.publicKey?.toString() ?? null);
      const handleDisconnect = () => setSolanaPubkey(null);
      provider.on?.("connect", handleConnect);
      provider.on?.("disconnect", handleDisconnect);
      if (provider.isConnected && provider.publicKey) setSolanaPubkey(provider.publicKey.toString());
      return () => {
        provider.off?.("connect", handleConnect);
        provider.off?.("disconnect", handleDisconnect);
      };
    }
    // If no Phantom detected, show Safe tab by default
    if (!provider || !provider.isPhantom) setActiveConnectTab("safe");
  }, []);

  async function connectSolana() {
    try {
      setConnectingSol(true);
      setError(null);
      const w = window as any;
      const provider = w?.solana;
      if (!provider) throw new Error("Phantom wallet not detected");
      const res = await provider.connect();
      const pk = res?.publicKey?.toString?.() ?? provider.publicKey?.toString?.() ?? null;
      setSolanaPubkey(pk);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect wallet";
      setError(msg);
    } finally {
      setConnectingSol(false);
    }
  }

  async function disconnectSolana() {
    try {
      const w = window as any;
      const provider = w?.solana;
      await provider?.disconnect?.();
      setSolanaPubkey(null);
    } catch {}
  }

  async function deploySafe() {
    setDeployingSafe(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/polymarket/safe/deploy`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed to deploy Safe (${res.status})`);
      const addr = data?.proxyAddress || data?.safeAddress || data?.address;
      setSafeAddress(addr ?? null);
      // Advance to credentials step if Safe deployed successfully
      setCurrent(2);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to deploy Safe";
      setError(msg);
    } finally {
      setDeployingSafe(false);
    }
  }

  async function fetchPortfolioData() {
    const address = solanaPubkey ?? primaryWallet?.address;
    if (!address) {
      setError("No wallet connected");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/portfolio`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!res.ok) throw new Error(`Portfolio fetch failed: ${res.status}`);
      const data = await res.json();
      setPortfolioData(data.data);
      setCurrent(2);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fetch portfolio data";
      setError(msg);
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
          profileData: {
            displayName,
            bio,
            website,
          },
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to complete onboarding";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-2">Choose your role, connect your portfolio, and set up your profile</p>
        </div>

        <Stepper steps={steps} currentStep={current} onStepChange={setCurrent} />

        {current === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Your Role</CardTitle>
              <CardDescription>Choose how you want to participate in prediction markets</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                role="radiogroup"
                aria-label="Select your role"
                className="space-y-3"
              >
                {ROLES.map((r, idx) => {
                  const selected = role === r;
                  return (
                    <div
                      key={r}
                      role="radio"
                      aria-checked={selected}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setRole(r)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setRole(r);
                        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                          setRole(cycleRole(idx, 1));
                        }
                        if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                          setRole(cycleRole(idx, -1));
                        }
                      }}
                      className={`w-full p-4 border rounded-lg cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        selected ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
                      }`}
                    >
                      <div className="font-semibold">{r.charAt(0).toUpperCase() + r.slice(1)}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {r === "creator" && "Create and manage prediction markets"}
                        {r === "participant" && "Trade and participate in markets"}
                        {r === "both" && "Create markets and trade"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {current === 1 && (
          <Card className="border-muted-foreground/20">
            <CardHeader>
              <CardTitle>Connect Your Portfolio</CardTitle>
              <CardDescription>Verify your on-chain credentials and experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Tabs value={activeConnectTab} onValueChange={(v) => setActiveConnectTab(v as any)}>
                <TabsList className="grid grid-cols-2 w-full rounded-xl bg-muted p-1">
                  <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg py-2" value="solana">Solana Wallet</TabsTrigger>
                  <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg py-2" value="safe">Deploy EVM Safe</TabsTrigger>
                </TabsList>

                <TabsContent value="solana" className="space-y-4">
                  <ShineBorder className="rounded-lg">
                    <div className="p-4 rounded-lg bg-background">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">Detected Wallet</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {solanaDetected ? "Phantom detected" : "No Phantom detected. Install Phantom to continue."}
                          </div>
                        </div>
                        <Badge variant={solanaPubkey ? "default" : "secondary"}>
                          {solanaPubkey ? "Connected" : "Not Connected"}
                        </Badge>
                      </div>
                      {solanaPubkey && (
                        <div className="text-xs text-muted-foreground mt-2 font-mono break-all">{solanaPubkey}</div>
                      )}
                    </div>
                  </ShineBorder>
                  <div className="flex gap-2">
                    {!solanaPubkey ? (
                      <Button onClick={connectSolana} disabled={!solanaDetected || connectingSol} aria-busy={connectingSol}>
                        {connectingSol ? (<><Spinner className="mr-2 h-4 w-4" /> Connecting...</>) : "Connect Phantom"}
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={disconnectSolana}>Disconnect</Button>
                    )}
                    <Button onClick={fetchPortfolioData} disabled={loading || !(solanaPubkey || primaryWallet)} className="ml-auto" aria-busy={loading}>
                      {loading ? (<><Spinner className="mr-2 h-4 w-4" /> Analyzing Portfolio...</>) : "Fetch Portfolio Data"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="safe" className="space-y-4">
                  <ShineBorder className="rounded-lg">
                    <div className="p-4 rounded-lg bg-background">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">Account Abstraction Safe  creation (for EVm chains)</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Deploy a Safe smart account on Polygon using our relayer. This will be used for CLOB trading and custody.
                          </div>
                        </div>
                        <Badge variant={safeAddress ? "default" : "secondary"}>{safeAddress ? "Deployed" : "Not Deployed"}</Badge>
                      </div>
                      {safeAddress && (
                        <div className="mt-2 text-xs font-mono break-all">Deployed Safe: {safeAddress}</div>
                      )}
                    </div>
                  </ShineBorder>
                  <div className="flex gap-2">
                    <Button onClick={deploySafe} disabled={deployingSafe} aria-busy={deployingSafe}>
                      {deployingSafe ? (<><Spinner className="mr-2 h-4 w-4" /> Deploying...</>) : "Deploy Safe on Polygon"}
                    </Button>
                    {safeAddress && (
                      <Button variant="outline" onClick={() => setCurrent(2)}>Use This Safe</Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
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
          <div className="p-3 bg-rose-50 dark:bg-rose-950 rounded-lg border border-rose-200 dark:border-rose-800" aria-live="polite">
            <div className="text-sm text-rose-900 dark:text-rose-100">{error}</div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="lg"
            className="rounded-lg"
            disabled={current === 0 || loading}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            Back
          </Button>
          {current < steps.length - 1 ? (
            <Button
              size="lg"
              className="rounded-lg"
              disabled={!canNext || loading}
              aria-busy={loading}
              onClick={() => {
                if (current === 1) {
                  fetchPortfolioData();
                } else {
                  setCurrent((c) => Math.min(steps.length - 1, c + 1));
                }
              }}
            >
              {loading ? (<><Spinner className="mr-2 h-4 w-4" /> Loading...</>) : "Continue"}
            </Button>
          ) : (
            <Button size="lg" className="rounded-lg" onClick={onComplete} disabled={loading} aria-busy={loading}>
              {loading ? (<><Spinner className="mr-2 h-4 w-4" /> Completing...</>) : "Go to Markets"}
            </Button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
