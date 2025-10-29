"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function SignupPage(): any {
  const router = useRouter();
  const { login, authenticated } = usePrivy();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authenticated) router.replace("/creator-onboarding");
  }, [authenticated, router]);

  async function doLogin(method: "email" | "google" | "wallet") {
    setErr(null);
    setBusy(method);
    try {
      // Privy handles both signup and login with the same modal.
      await login({ loginMethods: [method] });
    } catch (e: any) {
      setErr(e?.message ?? "Signup failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-md transition-shadow hover:shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a Perplexity Markets account to start trading</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!!busy} onClick={() => doLogin("email")}>
            {busy === "email" ? "Creating…" : "Create account"}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" disabled={!!busy} onClick={() => doLogin("google")}>
              {busy === "google" ? "Loading…" : "Google"}
            </Button>
            <Button variant="outline" disabled={!!busy} onClick={() => doLogin("wallet")}>
              {busy === "wallet" ? "Loading…" : "Phantom"}
            </Button>
          </div>
          {err ? <div className="text-xs text-rose-500">{err}</div> : null}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="underline">Log in</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
