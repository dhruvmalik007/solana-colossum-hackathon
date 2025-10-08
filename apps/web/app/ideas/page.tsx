import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";

export default function IdeasPage() {
  const ideas = [
    {
      id: 1,
      title: "Will Solana TVL surpass $10B by Q2 2025?",
      description: "Track the total value locked across all Solana DeFi protocols",
      votes: 45,
    },
    {
      id: 2,
      title: "Will Jupiter DEX volume exceed $100B in 2025?",
      description: "Measure trading volume on Jupiter aggregator",
      votes: 32,
    },
    {
      id: 3,
      title: "Will Marinade staked SOL reach 50M SOL?",
      description: "Monitor liquid staking adoption on Marinade Finance",
      votes: 28,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Market Ideas</h1>
        <p className="text-sm text-muted-foreground">
          Suggest new prediction markets powered by Perplexity-Ask and community input
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit a new market idea</CardTitle>
          <CardDescription>Help us expand the Solana DeFi prediction ecosystem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Market question</label>
            <input
              type="text"
              placeholder="Will [protocol] reach [metric] by [date]?"
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              placeholder="Provide context and data sources..."
              className="mt-1 min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button>Submit idea</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Community suggestions</h2>
        {ideas.map((idea) => (
          <Card key={idea.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{idea.title}</CardTitle>
                  <CardDescription>{idea.description}</CardDescription>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button variant="outline" size="sm">
                    ▲
                  </Button>
                  <span className="text-sm font-medium">{idea.votes}</span>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
