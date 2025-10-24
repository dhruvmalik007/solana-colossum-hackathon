# Distributional Prediction Markets – On-Chain Program Design (Anchor)

This document consolidates the mathematical framework, hybrid order book model, and UX flows into a single, end‑to‑end design for the `packages/solana_prediction` Anchor program. It references:

- `development-specs/markets-design/MATHEMATICAL_FRAMEWORK.md`
- `development-specs/markets-design/HYBRID_ORDER_BOOK.md`
- `development-specs/markets-design/RESEARCH_SUMMARY.md`
- `development-specs/ux-story/MARKET_CREATOR_DETAILED_SPEC.md`
- `development-specs/ux-story/MARKET_PARTICIPANT_DETAILED_SPEC.md`

The design maps these specs into concrete on-chain accounts, PDAs, instructions, events, and invariants.

---

## 1. High‑Level Architecture

- On-chain program exposes a distributional market primitive supporting:
  - Market creation with initial distribution parameters (μ, σ, step, range)
  - Hybrid execution router: CLOB first (best price), AMM fallback
  - Position lifecycle: open → adjust → close → claim, with collateral accounting
  - Oracle-based resolution (Pyth) and post-resolution claims
  - Fee plumbing (platform, creator, LP)
- Off-chain indexer/UI interprets events to render live distributions, order book, and positions (per UX specs).

---

## 2. PDAs and Accounts

PDA seed conventions ensure deterministic state layout:

- Registry: `PDA("registry", authority)`
- Strategy (optional future CPI routing): `PDA("strategy", registry, strategy_key)`
- Market: `PDA("market", authority, slug)`
- LiquidityPool: `PDA("pool", market)`
- OrderBook: `PDA("orderbook", market)`
- CollateralVault: `PDA("collateral", market)`
- UserProfile: `PDA("user", owner)`
- Position: `PDA("position", owner, market)`
- PendingOrder (optional per order id): `PDA("pending", market, owner, order_id)`

Account summaries:

- Registry: Program authority and bumps
- Strategy: Mapping from strategy_key → target_program (future agent integrations)
- Market: Core market config and distribution parameters
- LiquidityPool: Vault reference and total liquidity
- OrderBook: Top of book snapshot + event counter (indexer consumes emitted events)
- CollateralVault: SPL Token vault PDA holding collateral (USDC/USDT)
- UserProfile: Per-trader counters and preferences (future-proof)
- Position: Per-trader per-market position state
- PendingOrder: Optional durable order record (CLOB evolution)

---

## 3. Instructions

### 3.1 Registry & Users

- init_registry(authority)
  - Creates `Registry` under `authority` to gate strategy configurations.
- upsert_strategy(authority, strategy_key, target_program)
  - Registry authority maps a strategy to a target program (future CPI)
- init_user(owner)
  - Creates `UserProfile` for wallet with counters.

### 3.2 Markets

- create_distributional_market(authority, params)
  - Creates `Market`, `LiquidityPool`, `OrderBook`, `CollateralVault` PDAs
  - Params include: `slug`, `outcome_min`, `outcome_max`, `unit`, `dist_type`, `mu`, `sigma`, `sigma_min`, `step`, `resolution_time`, `oracle_config`, `fee_bps_platform`, `fee_bps_creator`
- add_liquidity(authority, amount)
  - Mints LP shares or increments `total_liquidity` and transfers tokens to `CollateralVault`
- remove_liquidity(authority, amount)
  - Burns LP shares or decrements pool, enforcing solvency after pending orders

### 3.3 Orders & Execution (Hybrid Router)

- place_limit_order(owner, side, price_bps, size, expiry)
  - Emits `OrderPlaced` and updates top-of-book snapshot in `OrderBook`
  - Optional: persists a `PendingOrder` record (PDA) for durable order management
- cancel_order(owner, order_id)
  - Emits `OrderCancelled` and updates snapshot
- execute_market_order(taker, side, size)
  - Router: attempt CLOB fill at best price; fallback to AMM pricing if insufficient depth
  - Emits `TradeExecuted` with effective price

### 3.4 Positions & Collateral

- open_position(owner, market, size, collateral_estimate)
  - Creates `Position` PDA; records `size`, `collateral_locked`
  - Transfers collateral tokens into `CollateralVault` (future; today: record only)
  - Emits `PositionOpened`
- adjust_position(owner, position, delta_size, delta_collateral)
  - Grows/shrinks size and adjusts collateral with conservative rounding
  - Emits `PositionAdjusted`
- close_position(owner, position)
  - Freezes PnL at close, unlocks collateral (post-resolution the claim path returns remaining value)
  - Emits `PositionClosed`

### 3.5 Resolution & Claims

- resolve_market(authority, outcome_value, proof)
  - Validates oracle data (Pyth): staleness, confidence, normalization
  - Sets market status to Resolved and emits `MarketResolved`
- claim_payout(owner, position)
  - Computes entitlement (collateral +/- PnL) and transfers from vault
  - Emits `PayoutClaimed`

---

## 4. Pricing, Collateral & Risk (Math)

Mapping to `MATHEMATICAL_FRAMEWORK.md`:

- We maintain discretized distribution over `[outcome_min, outcome_max]` at step `Δx = step`.
- Collateral requirement uses a conservative bound of divergence between user distribution `g(x)` and market consensus `f(x)`.
- Base collateral formula used in UX: `RequiredCollateral ≈ max_x |g(x) - f(x)| × Position_Size`.
- On-chain we approximate with discretized L1 integral:

```
L1(f,g) ≈ Σ |g(x) - f(x)| Δx
```

- Implementation helpers live in `programs/solana_prediction/src/math.rs`:
  - `gauss_pdf(x, mu, sigma)`
  - `discretized_l1_distance(min, max, step, f, g)`
  - `discretized_l2_sq(...)` (for experimentation)
  - `conservative_round(amount)` – floors gains, ceils losses

- Risk handling:
  - Conservative rounding in all collateral adjustments
  - Fees deducted before crediting PnL
  - LP pool solvency ensured before liquidity withdrawals

---

## 5. Fees

- Platform fee: `fee_bps_platform`
- Creator fee: `fee_bps_creator`
- LP fee: implied via AMM spread or explicit fee schedule (TBD)
- Collected fees route to FeeVault PDA(s) (future iteration)

---

## 6. Events (for Indexer/UI)

- StrategyExecutionRequested
- MarketCreated
- OrderPlaced
- OrderCancelled
- TradeExecuted
- MarketResolved
- PayoutClaimed
- PositionOpened
- PositionAdjusted
- PositionClosed

Events are consumed by off-chain indexers to build the order book, distribution charts, and portfolio views in real-time per `MARKET_PARTICIPANT_DETAILED_SPEC.md`.

---

## 7. State Machines (UX ↔ On-Chain)

- Market: Draft → Active → Resolving → Resolved
- Position: Open → Adjusting → Closed → Claimed
- Orders: Live → PartiallyFilled → Filled/Cancelled/Expired

Transitions emit events and update snapshots in `OrderBook`.

---

## 8. Oracle Resolution (Pyth)

- Verify price account:
  - Status: trading
  - Staleness: `now - publish_time ≤ STALENESS_LIMIT`
  - Confidence bound ≤ MAX_CONFIDENCE
  - Normalize `price * 10^exponent`
- Map oracle outcome to the market's scalar domain
- After resolution, claims compare user distribution to delta at realized outcome per chosen scoring rule (see framework) and trigger transfers from `CollateralVault`.

---

## 9. Security & Invariants

- PDAs prove ownership/authority; checks:
  - `registry.authority == authority`
  - `strategy.registry == registry`
  - `position.owner == owner`
  - `position.market == market`
- Collateral never negative; pool solvency must hold after operations
- Time checks: orders `expiry`, market `resolution_time`
- All arithmetic uses conservative rounding against the trader
- Access control:
  - Market creation by authenticated creators (future: role gating)
  - Resolution only by oracle authority or governance

---

## 10. Gas & Performance

- Order book: on-chain stores top-of-book snapshot; full depth is reconstructed off-chain from events (CEX-like tape). This reduces account size and compute for each instruction.
- Distribution updates: heavy math kept minimal on-chain; rely on discretized steps and pre-validated params.
- Batch operations (future): netting multiple order modifications per transaction.

---

## 11. Integration Points

- Frontend routes integrate via wallet approval flows (Phantom/Solflare) defined in UX specs.
- API endpoints (app router) for portfolio snapshots and market lists.
- Copilot agents suggest distributions and trade sizes; on accept, UI translates to `open_position` / `place_limit_order` instructions.

---

## 12. Roadmap (Incremental Implementation Plan)

1) Baseline (in repo now)
- Accounts: Registry, Strategy, Market, LiquidityPool, OrderBook, CollateralVault, Position, PendingOrder
- Instructions: init_registry, upsert_strategy, create_distributional_market, place_limit_order, execute_market_order, cancel_order, resolve_market, claim_payout (stubs in parts)
- Math helpers for distributions

2) Positions & Users (next)
- Add `init_user`, `open_position`, `adjust_position`, `close_position`
- Emit `Position*` events; keep token transfers as a later step

3) SPL Token Collateral (later)
- Add `anchor-spl` dependency, integrate token transfers between user and `CollateralVault`
- Fee routing to FeeVault PDAs

4) Oracle Verification (later)
- Implement Pyth price account verification and normalization

5) CLOB Depth (later)
- Optional `PendingOrder` durable records with partial fill bookkeeping

6) Tests
- Anchor tests for position lifecycle, fee correctness, and resolution

---

## 13. Seeds & Sizes (Reference)

- All account `SIZE` constants are defined for rent exemption calculations (see `lib.rs`).
- Seeds are listed in Section 2; `bump` stored on each PDA for re-derivation.

---

## 14. Compliance with UX Specs

- Transaction modals, progress, and confirmations map to events emitted by the program.
- Distribution editing UI (template, sliders, direct draw) produces `g(x)`; UI computes suggested collateral; program enforces conservative check.
- Portfolio dashboard maps to `Position` PDAs and events.

---

## 15. Open Questions

- Exact AMM curve for distributional liquidity (grid vs continuous approximation)
- Formal scoring rule used in post‑resolution payouts (currently L1‑based conservative bound; can be extended)
- Governance model for market creators and oracle authorities

---

This design is compatible with the current code in `programs/solana_prediction/src/lib.rs` and extends it with concrete user/position flows, token collateralization, and oracle checks in incremental steps that maintain deployability.
