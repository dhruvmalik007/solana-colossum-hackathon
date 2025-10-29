# Solana Distribution Markets — Detailed UX Workflow

This spec translates Polymarket’s event page layout into a distribution-market UX while leveraging Paradigm’s continuous-outcome design. It maps each section to concrete components in `apps/web/` and `@repo/ui/` and defines data/interaction flows.

## Page Layout (Market Detail)

- **Left main panel (tabs):**
  - Distribution (default)
  - Order Book
  - Graph
  - Resolution
  - About
  - Rules + Embeds
  - Discussion
- **Right sidebar:** Trading panel

```mermaid
graph TD
  A[Market Route /markets/[slug]] --> B[Header: title, category]
  B --> C{Tabs}
  C --> C1[Distribution]
  C --> C2[Order Book]
  C --> C3[Graph]
  C --> C4[Resolution]
  C --> C5[About]
  C --> C6[Rules + Embeds]
  C --> C7[Discussion]
  A --> D[Right: TradePanel]
```

## Section Definitions

- **Distribution**
  - Components: `DistributionChart` + `LiquidityStats`
  - Overlays: Consensus density, User belief (Gaussian), Initial prior
  - Inputs (future): mean/σ sliders; preview payout at cursor

- **Order Book (Distributional)**
  - Component: `OrderBookClient` with range-order placement
  - Orders specify `[min,max]` interval and size; display top-of-book density by aggregated bin weights

- **Graph**
  - Time-series chart of consensus parameters (e.g., mean, variance) + liquidity over time
  - Source: internal snapshots; MVP placeholder with `DistributionChart` historical overlays

- **Resolution**
  - Shows primary/secondary resolution sources with time, value, and dispute window
  - Pulls DeFiLlama metrics via `/api/protocol/defillama` and stores final value hash

- **About**
  - Market description and collateral rules

- **Rules + Embeds**
  - `RuleSummary` + `SocialEmbeds` (X/Bluesky/Instagram proxy+sanitize)

- **Discussion**
  - `DiscussionThread` (comments list, post, vote) powered by `/api/comments`

## Component Mapping

- `apps/web/app/markets/[slug]/page.tsx` → uses `MarketTabs`
- `@repo/ui/components/market/MarketTabs.tsx` → tabs shell
- `@repo/ui/components/DistributionChart.tsx` → density overlays
- `@repo/ui/components/market/LiquidityStats.tsx` → liquidity and 24h vol
- `apps/web/components/OrderBookClient.tsx` → range orders + book
- `@repo/ui/components/market/RuleSummary.tsx` + `SocialEmbeds.tsx`
- `@repo/ui/components/market/DiscussionThread.tsx`
- `@repo/ui/components/TradePanel.tsx`

## Data & APIs

- Markets: `GET /api/markets`, `GET /api/markets/[slug]`
- Resolution data: `GET /api/protocol/defillama?path=...` (allowlisted)
- Comments: `GET/POST /api/comments`, `POST /api/comments/[id]/vote`
- Embeds: `GET/POST /api/embeds`
- Seeding: `GET /api/seed`, `POST /api/markets/seed`

## Microcopy & UI Behavior

- Labels align with Polymarket conventions: Tabs: Order Book, Graph, Resolution; clear market title and category
- Tooltips on Distribution chart: show probability density, implied payout
- Order book rows: interval, price (implied), size, total; bids/asks color-coded
- Resolution tab shows final value and timestamp plus links to source and verification hash

## MVP → Next

- MVP: placeholders for Graph and Activity; distribution inputs read-only
- Next: live Gaussian input, dynamic payout curve preview, activity feed (orders, trades), and param history

