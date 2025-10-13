import HomeProtocolsClient from "../components/HomeProtocolsClient";
import { FadeIn } from "@repo/ui/components/fade-in";

export default async function Home(): Promise<any> {
  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Solana DeFi Prediction Markets</h1>
          <p className="text-muted-foreground text-sm">
            Building a continuous  prediction marketplace platform on solana marketplace.
          </p>
        </div>
      </FadeIn>
      
      <FadeIn delay={0.1}>
        <HomeProtocolsClient />
      </FadeIn>
    </div>
  );
}
