"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import * as React from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function LoginPage(): any {
  const { login } = usePrivy();
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function doLogin(method: "email" | "google" | "wallet") {
    setErr(null); setBusy(method);
    try {
      await login({ loginMethods: [method] });
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally { setBusy(null); }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Log in</CardTitle>
          <CardDescription>Sign in to your Perplexity Markets account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full" disabled={!!busy} onClick={() => doLogin("email")}>{busy === "email" ? "Loading…" : "Log in"}</Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" disabled={!!busy} onClick={() => doLogin("google")}>{busy === "google" ? "Loading…" : "Google"}</Button>
            <Button variant="outline" disabled={!!busy} onClick={() => doLogin("wallet")}>{busy === "wallet" ? "Loading…" : "Phantom"}</Button>
          </div>
          {err ? <div className="text-xs text-rose-500">{err}</div> : null}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account? {" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
