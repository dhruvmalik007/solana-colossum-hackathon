# Market Lifecycle and Settlement

## 1. States
- Draft → Live → Pre-Expiry → Expired → Resolved → Payouts → Closed

## 2. Creation (Creator)
- Select mechanism: Binary pm-AMM or Distribution Market.
- Set parameters: expiry `T`, fees, liquidity scale/budget, constraints, oracle.
- Deposit initial liquidity/budget.

## 3. Trading (Participant)
- Request quote → receive price/cost, slippage, fee, collateral (distribution) → execute.
- Protections: max Δ per block; min σ; fee escalators; solver fallback.

## 4. Pre-Expiry Protections
- Threshold `T - t < τ`: throttle size, increase fee, switch to maker-only if needed.

## 5. Resolution
- Oracle fetch; binary: YES/NO; distribution: realized `x_0`.
- Settlement window and dispute period optional.

## 6. Payouts
- Binary: redeem outcome tokens for $1/$0; LP residual handled per invariant accounting.
- Distribution: positions pay `f(x_0)`; ensure budget `b` sufficient by construction.

## 7. Failure Handling
- Oracle delay: freeze trading; extend settlement.
- Numerical issues: pause; admin resolve or re-quote.
- Insolvency prevention: enforced at trade-time (σ bounds, collateral floors).

## 8. Events
- Emit on creation, liquidity changes, trades, resolution, payouts; indexer consumes.
