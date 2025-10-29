import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import OrderBookClient from "../../../components/OrderBookClient";
import { getMarketBySlug } from "@repo/database";
import { TradePanel } from "@repo/ui/components/TradePanel";
import { MarketTabs } from "@repo/ui/components/market/MarketTabs";
import { DistributionChart } from "@repo/ui/components/DistributionChart";
import { LiquidityStats } from "@repo/ui/components/market/LiquidityStats";
import { RuleSummary } from "@repo/ui/components/market/RuleSummary";
import { SocialEmbeds } from "@repo/ui/components/market/SocialEmbeds";
import { DiscussionThread } from "@repo/ui/components/market/DiscussionThread";

export default async function MarketPage({ params }: { params: { slug: string } }): Promise<any> {
  const { slug } = params;
  const m = await getMarketBySlug(slug);
  if (!m) return notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{m.title}</CardTitle>
            <CardDescription>{m.category || "Market"}</CardDescription>
          </CardHeader>
          <CardContent>
            <MarketTabs
              distribution={
                <div className="space-y-4">
                  <DistributionChart marketRange={[0, 100]} height={260} />
                  <LiquidityStats liquidity={0} volume24h={0} />
                </div>
              }
              orderBook={<OrderBookClient slug={slug} />}
              activity={<p className="text-sm text-muted-foreground">Activity coming soon.</p>}
              about={
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {m.description || "Distributional prediction market on Solana. No real trading is enabled in this demo."}
                </p>
              }
              rulesAndEmbeds={
                <div className="space-y-4">
                  <RuleSummary text={m.description} />
                  <SocialEmbeds marketId={m.id} />
                </div>
              }
              discussion={<DiscussionThread marketId={m.id} />}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <TradePanel slug={slug} />
      </div>
    </div>
  );
}
