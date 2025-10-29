import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";

export type SuggestionItem = {
  id: string;
  title: string;
  description: string;
  votes: number;
  createdAt: string;
  author?: string;
};

export function SuggestionsList({ items }: { items: SuggestionItem[] }) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">No suggestions yet</CardTitle>
          <CardDescription>Be the first to propose a market idea.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((idea) => (
        <Card key={idea.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">{idea.title}</CardTitle>
                <CardDescription>{idea.description}</CardDescription>
              <CardContent>
                <p>{idea.createdAt}</p>
                <p>{idea.author}</p>
              </CardContent>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Button variant="outline" size="sm">▲</Button>
                <span className="text-sm font-medium">{idea.votes}</span>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
