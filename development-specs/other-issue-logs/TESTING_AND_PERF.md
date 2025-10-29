# Testing and Performance Plan

## Scope
Covers programs, indexer, web, and database.

## Tests
- **Math unit tests**: discretization, invariant, collateral (Rust + TS parity)
- **Program tests**: Anchor `create_market`, `place_order`, `match_best`, `swap_or_quote`, `resolve_market`
- **Indexer tests**: decode fixtures of logs → idempotent upserts
- **Web e2e**: create → list → order → stream orderbook → resolve → claim (Playwright)

## Fixtures
- Seeded markets with orders/trades; deterministic timestamps
- Pyth price account snapshot for resolution tests

## Performance Targets
- Web: orderbook SSE ≤ 1.5s refresh, GSI queries only (no scans in prod)
- DB: top-of-book query ≤ 50 ms p95 after GSIs
- Indexer: < 1s event-to-DB p95 at 10 rps
- Programs: per-IX CU budget within Solana norms; no large loops on-chain

## Observability
- Structured logs with txSig, slot, idemp
- Control table checkpoints and simple metrics

## Hardening
- Input validation (Zod schemas)
- Conservative rounding in collateral math
- Min trade sizes; fee sanity checks
- Replay protection via idempotency key
