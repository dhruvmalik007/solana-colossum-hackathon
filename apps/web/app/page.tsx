import HomeProtocolsClient from "../components/HomeProtocolsClient";

export default async function Home() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Solana DeFi Prediction Markets</h1>
        <p className="text-muted-foreground text-sm">
          Powered by MCP: Perplexity-Ask. Explore markets on Solana protocols using DefiLlama data.
        </p>
      </div>
      <HomeProtocolsClient />
    </div>
  );
}
