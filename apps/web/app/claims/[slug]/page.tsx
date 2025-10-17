import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { getMarketBySlug } from "@repo/database";

export default async function ClaimsPage({ params }: { params: Promise<{ slug: string }> }): Promise<any> {
  const { slug } = await params;
  const market = await getMarketBySlug(slug);
  if (!market) return notFound();
  
  // Check if market is resolved
  const isResolved = market.status === "Resolved";
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>
        <p className="text-sm text-muted-foreground">{market.title}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Market Status</CardTitle>
          <CardDescription>Resolution and payout information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className="font-medium">{market.status}</span>
          </div>
          
          {!isResolved && (
            <div className="rounded-lg border border-amber-500 bg-amber-50 p-4 text-sm">
              <p className="font-medium text-amber-900">Market not yet resolved</p>
              <p className="text-amber-700 mt-1">Claims will be available once the oracle resolves this market.</p>
            </div>
          )}
          
          {isResolved && (
            <>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Your claimable amount:</span>
                <span className="font-mono font-medium">0.00 USDC</span>
              </div>
              
              <Button className="w-full" disabled>
                Claim Payout (Coming Soon)
              </Button>
              
              <p className="text-xs text-muted-foreground">
                On-chain settlement via router::settle() will be enabled once the program is deployed.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
