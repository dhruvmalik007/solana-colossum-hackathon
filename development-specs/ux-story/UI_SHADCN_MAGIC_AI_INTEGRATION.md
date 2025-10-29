# UI Integration Plan — shadcn/ui + shadcn/ai (Magic-UI patterns)

This document defines the component-level integration plan to deliver a Polymarket-style event page adapted for distribution markets, leveraging shadcn/ui for primitives and shadcn/ai for dynamic AI interactions.

## Libraries

- shadcn/ui: buttons, inputs, tabs, cards, select, badge, dropdown, dialog, sheet, tooltip, toast
- shadcn/ai: chat UI, tool-calling (agent) hooks for commentary and news updates
- Patterns from Magic UI: animated counters, metric tiles, skeleton loaders, trendy navigation and list cards

## Components to Use

- Tabs: `@repo/ui/components/ui/tabs` (already present)
- Cards: `Card, CardHeader, CardTitle, CardDescription, CardContent`
- Inputs: `Input`, `Textarea`, `Select`, `Slider` (for mean/σ later)
- Data display: `Badge`, `Separator`, `Tooltip`, `Toast`
- Overlays: `Dialog` for resolution details and source links
- AI UI: `Chat` container with messages list + composer (shadcn/ai pattern)

## Market Detail Assembly

- Header
  - `Card` with title, category, market stats badges (TVL market, 24h vol)
- Tabs (left)
  - Distribution: `DistributionChart`, sliders (future), tooltips, skeletons
  - Order Book: `OrderBookTable` + range order form (inputs & button)
  - Graph: time-series overlays (placeholder chart), range picker
  - Resolution: `Dialog` to show final value, source links, dispute timer; CTA to open proof JSON
  - About: rich text
  - Rules + Embeds: `RuleSummary` + `SocialEmbeds`
  - Discussion: `DiscussionThread`
- Right sidebar
  - `TradePanel` with `Select` buy/sell, `Input` size, fee breakdown, CTA

## AI Integration Hooks

- Discussion enrichment
  - shadcn/ai chat surface for AI-assisted summaries of comment threads
  - Tools: fetch recent comments, summarize, extract entities, propose highlights
- Market news/links
  - Tool-calling to gather links (X/Bluesky posts), suggest embeds, and push to `/api/embeds`
- Resolution helper
  - Tool to fetch DeFiLlama metric, calculate final bin, propose resolution payload

## UX Notes

- Keyboard shortcuts: `?` opens shortcuts dialog; `/` focuses search; `g o` jumps to Order Book tab
- Motion: subtle transitions on tab change; skeletons while data loads
- Mobile: Tabs collapse into scrollable pill list; sidebar becomes bottom sheet

## Implementation Steps

1. Add AI panel (optional tab) using shadcn/ai to summarize market updates
2. Enhance Distribution tab with tooltip explaining probability density and payout
3. Add Resolution dialog with copy-to-clipboard of resolved value hash
4. Wire comments sort (Newest/Top) and holder filter toggle
5. Add toast feedback on comment post and embed add

## Example: Minimal AI Chat Block

```tsx
import { Chat } from "shadcn-ai";

export function MarketAI({ slug }: { slug: string }) {
  return (
    <Chat
      messages={[]}
      onSend={async (msg) => {
        // call your /api/ai route with tools (fetch comments, fetch defillama)
        return { role: "assistant", content: `Summary for ${slug}: ...` };
      }}
    />
  );
}
```
