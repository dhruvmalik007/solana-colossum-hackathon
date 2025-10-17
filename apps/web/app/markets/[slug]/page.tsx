import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import OrderBookClient from "../../../components/OrderBookClient";
import { getMarketBySlug } from "@repo/database";

export default async function MarketPage({ params }: { params: Promise<{ slug: string }> }): Promise<any> {
  const { slug } = await params;
  const m = await getMarketBySlug(slug);
  if (!m) return notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order book</CardTitle>
            <CardDescription>{m.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderBookClient slug={slug} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
            <CardDescription>Market details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {m.description || "Distributional prediction market on Solana. No real trading is enabled in this demo."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
