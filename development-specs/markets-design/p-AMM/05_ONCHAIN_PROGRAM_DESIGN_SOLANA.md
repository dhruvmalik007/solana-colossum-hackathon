# On-Chain Program Design (Solana / Anchor)

## 1. Accounts
- `Market` (PDA): id, type {pmAMM|distribution}, params (T, fee, oracle, protections), pm-AMM {L0, dynamic_on}, distribution {family, k or b, σ_min, σ_max}.
- `Pool` (PDA): pm-AMM reserves {x, y}, L schedule state; distribution summary {μ, σ, λ} snapshot and invariant constants.
- `LPPosition`: owner, shares, fee accrual.
- `TraderPosition`: escrow vault, last trade summary, constraints attestations.
- `OracleFeed`: config, authority, last value.

## 2. Instructions
- `create_market`, `provide_liquidity`, `withdraw_liquidity`.
- `quote_pmamm`, `trade_pmamm`.
- `quote_distribution`, `trade_distribution`.
- `update_liquidity_schedule`, `set_params`, `pause`, `resolve_market`, `claim_payout`.

## 3. Numerics and Approximations
- Implement `ϕ` and `Φ` with rational approximations suitable for fixed-point (e.g., Abramowitz–Stegun 7.1.26 for Φ; piecewise for tails).
- Newton–Raphson with bracketed fallback; cap iterations; revert on non-convergence.
- Fixed-point: 64.64 or 32.32 depending on compute budget; pre-scale inputs; avoid overflow.
- For distribution Normal PDF: bounded domain windows (e.g., ±6σ), LUT caching.

## 4. Constraints and Guards
- Enforce σ ≥ σ_min; enforce `max f(x) ≤ b` by construction.
- Collateralization: require `C = -min_x (g - f)` proof parameters and verify numerically on-chain with derivative sign checks and dust thresholds.
- Near-expiry throttles; maker-only switch.

## 5. Events
- `MarketCreated`, `LiquidityChanged`, `TradeExecuted{pmamm|dist}`, `ScheduleUpdated`, `Resolved`, `PayoutClaimed`.

## 6. Security
- Authority separation for pause/resolve; oracle authenticity.
- Replay protection via slot/nonce.
- Denial-of-service mitigations: per-tx compute guards, rate limits via API.
