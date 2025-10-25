import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { ReactNode} from "react";
import { SuggestionsList } from "../../components/suggestions/SuggestionsList";
export default async function IdeasPage() : Promise<any> {
  async function loadSuggestions() {
    try {
      const res = await fetch("/api/suggestions", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      return Array.isArray(json?.data) ? json.data as { id: string; title: string; description: string; votes: number; createdAt: string; author?: string }[] : [];
    } catch {
      return [] as any[];
    }
  }

  // Server Component: await data fetch
  const ideas = (global as any).__ideasCache ?? null;
  const dataPromise = ideas ? Promise.resolve(ideas) : loadSuggestions();
  // Note: this top-level await is allowed in Next.js Server Components
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const items = await dataPromise;

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
        <SuggestionsList items={items} />
      </div>
    </div>
  );
}
