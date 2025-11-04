"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/components/ui/tabs";
import * as React from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function LoginPage(): any {
  const { login } = usePrivy();
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function doLogin(method: "email" | "google" | "github" | "wallet") {
    setErr(null); setBusy(method);
    try {
      await login({ loginMethods: [method] });
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally { setBusy(null); }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>Sign in or create an account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <Button className="w-full" disabled={!!busy} onClick={() => doLogin("email")} aria-busy={busy === "email"}>
                {busy === "email" ? (<><Spinner className="mr-2 h-4 w-4" /> Logging in…</>) : "Log in"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" disabled={!!busy} onClick={() => doLogin("google")} aria-busy={busy === "google"}>Google</Button>
                <Button variant="outline" disabled={!!busy} onClick={() => doLogin("github")} aria-busy={busy === "github"}>GitHub</Button>
                <Button variant="outline" disabled={!!busy} onClick={() => doLogin("wallet")} aria-busy={busy === "wallet"}>Wallet</Button>
              </div>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <Button className="w-full" disabled={!!busy} onClick={() => doLogin("email")} aria-busy={busy === "email"}>Create account</Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" disabled={!!busy} onClick={() => doLogin("google")} aria-busy={busy === "google"}>Google</Button>
                <Button variant="outline" disabled={!!busy} onClick={() => doLogin("github")} aria-busy={busy === "github"}>GitHub</Button>
                <Button variant="outline" disabled={!!busy} onClick={() => doLogin("wallet")} aria-busy={busy === "wallet"}>Wallet</Button>
              </div>
            </TabsContent>
          </Tabs>
          {err ? <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700" role="alert">{err}</div> : null}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-xs text-muted-foreground">By continuing you agree to our Terms and Privacy.</div>
        </CardFooter>
      </Card>
    </div>
  );
}
