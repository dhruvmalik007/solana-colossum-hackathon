# Marketplace UI/UX System Design

This document defines the marketplace UI & interaction system for the web app, synthesizing patterns from Metaculus, Kalshi, and Polymarket, and aligning with:
- `development-specs/markets-design/*`
- `development-specs/ux-story/*`
- `development-specs/agentic-design-workflow/*`
- `development-specs/solana-onchain-protocol.md`

The system is componentized for reuse via `@repo/ui` and wired in `apps/web`.

---

## 1. Information Architecture

- Landing
  - Hero summary, CTA (Explore, Create)
  - Quick categories (All, Crypto, DeFi, Macro, Tech, Science, AI, Sports, Politics)
  - Featured/Trending markets
- Markets List
  - Filters: category, search, sorting (Newest, Trending, Resolving Soon)
  - Cards with status, resolution time, category
- Market Details
  - Order book + recent trades
  - Distribution view (prediction chart)
  - Trade panel (market/limit, size, collateral estimates)
  - About tab, Rules, Oracle info
- Create Market
  - Stepper (template → parameters → collateralization preview → submit)
- Account / Portfolio
  - Positions, PnL, orders, activity
- Creator Onboarding
  - Role, portfolio link, verification, profile setup

---

## 2. Pages → Components Mapping

- Landing page
  - `LandingHero` (motion + CTA)
  - `CategoriesNav` (quick filtering)
  - `MarketsGrid` (uses MarketCard)
- Markets list
  - `FiltersBar` (category, search, sort)
  - `MarketsGrid`
- Market details
  - `OrderBookTable`
  - `DistributionChart`
  - `TradePanel` (form + validation + fee breakdown + txn status)
  - `Tabs` (About, Rules, Oracle)
- Create market
  - `Stepper`, `Form*` field components
  - `FeeBreakdown`, `CollateralBar`
- Shared
  - `AnimatedCard`, `Spinner`, `PageTransition`, `TopLoadingBar`

---

## 3. Data & API

- `/api/markets` → list, search (`q`), category filter (`category`)
- `/api/orders`, `/api/orderbook` → order flow
- `/api/portfolio` → positions
- `/api/protocol` → protocol metadata
- Future: `/api/markets/[slug]` (SSR fetch), websocket or SSE for live updates

---

## 4. Interaction Patterns

- Filters and search debounce (300ms)
- Optimistic UI for order placement with rollback
- Loading skeletons → `Spinner`
- Toast notifications for success/failure
- Copilot sidebar for assisted flows (market suggestion, trade sizing)

---

## 5. Visual Patterns (shadcn + magic-ui)

- Cards and subtle motion for discovery
- Tabs for market sub-sections
- Buttons (primary for trade/create, outline for secondary actions)
- Charts (Recharts) for distribution and history

---

## 6. Roadmap (Implementation)

1) MVP Landing & List (done in code)
- `LandingHero`, `CategoriesNav`, `MarketsSection` integrated on `/`
- `/api/markets` supports `category` & `q`, error-safe

2) Market Details Enhancements
- Add `DistributionChart` instance on details page
- Add `TradePanel` (form stub)

3) Orders & Portfolio
- Implement `/api/orders` and wire `OrderBookTable` + mock depth
- `/api/portfolio` table on Account page

4) Creator Flow
- Complete create market stepper with validation and submit to `/api/markets` POST

5) Live Data & Indexing
- SSE or polling for order book updates and trades

6) Theming & Polish
- Empty states, loading skeletons, error boundaries

---

## 7. Integration to On-Chain

- Map TradePanel submits to client SDK that builds Anchor transactions (program `solana_prediction`)
- Events (`MarketCreated`, `TradeExecuted`, `Position*`) feed indexer for UI
- Oracle info shown in Rules tab

---

## 8. Configuration

- HTTPS enforced via middleware when `ENFORCE_HTTPS=1`
- Amplify branch envs set automatically from workflow
- Optional custom domain association via workflow step when `AMPLIFY_DOMAIN_NAME` is provided
