# Off-Chain Indexer and API

## 1. Indexer
- Subscribe to Anchor events; persist markets, pools, trades, resolutions.
- Derive aggregates (liquidity, volume, fees, utilization); publish to DB.

## 2. API Endpoints (REST)
- `GET /markets?type&status&limit&cursor` → list markets.
- `GET /markets/:id` → market detail.
- `POST /markets` → create (creator-only; auth required).
- `POST /quotes/pmamm` → { side, size, marketId } → { avgPrice, slippage, fee, impact, bounds }.
- `POST /trades/pmamm` → executes trade.
- `POST /quotes/distribution` → { μ, σ, marketId } → { cost, fee, collateral, constraints }.
- `POST /trades/distribution` → executes with collateral.
- `POST /resolve` → admin/oracle.
- `GET /liquidity/:marketId` → LP view.
- `GET /stream/orderbook/:marketId` (if hybrid streams are offered).

## 3. Schemas
- Define JSON request/response contracts with precise numeric fields (strings for big numbers); include tolerance hints and versioning.

## 4. Performance & Caching
- Cache static metadata; short-TTL for quotes; protect with rate limits.
- SSE/WebSocket for streaming curves/quotes if needed.

## 5. Auth & Permissions
- Creator operations gated; participant quotes open; trades require wallet signature via tx relay.
