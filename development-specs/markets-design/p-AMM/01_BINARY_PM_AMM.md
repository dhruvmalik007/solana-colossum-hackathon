# Binary Markets – pm-AMM (Static and Dynamic)

## 1. Model and Uniformity
- Two outcome tokens: `X` (YES) resolves to $1 if event occurs; `Y` (NO) resolves to $1 otherwise.
- Price process assumption: Gaussian score dynamics (event determined by whether a random walk crosses a threshold by expiry `T`).
- Loss-vs-Rebalancing (LVR): expected arbitrage loss rate of AMM given asset dynamics.
- Uniform AMM: LVR proportional to portfolio value across prices.

## 2. Static pm-AMM Invariant
- Let `x` be YES reserves and `y` be NO reserves. Let `L` be liquidity scale.
- Invariant:
```
(y - x) * Φ((y - x)/L) + L * ϕ((y - x)/L) - y = 0
```
where `ϕ` is Normal PDF and `Φ` is Normal CDF.
- Properties:
  - Per-dollar LVR is uniform over price.
  - Expected pool value decays with remaining time as `E[V_t] ∝ sqrt(T - t)`.

## 3. Dynamic pm-AMM
- Time-varying liquidity to keep expected LVR rate constant over time.
- Replace `L` with `L * sqrt(T - t)` yielding dynamic invariant:
```
(y - x) * Φ((y - x)/(L * sqrt(T - t)))
+ L * sqrt(T - t) * ϕ((y - x)/(L * sqrt(T - t))) - y = 0
```
- Intuition: reduce provided liquidity as expiry approaches.

## 4. Pricing, Quoting, and Execution
- Inputs: side (buy YES/NO), size (Δ), fee rate `f`, current reserves `(x, y)`, time `t`.
- Goal: compute trade that preserves invariant after fees.
- Approach:
  - Transform to price coordinate via marginal price implied by invariant.
  - Use numerical root-finding (Newton–Raphson with bracketing fallback) to solve for new `(x', y')` satisfying invariant after applying Δ and fees.
  - Compute average price and slippage from integral along curve.
- Numerical safety:
  - Bound iterations; monotone bracket; clamp near `t → T`; guard against `|y - x|/L` extremes.
  - Use polynomial/rational approximations for `Φ` and `ϕ` in fixed point (see 05_ONCHAIN...).

## 5. Fees and LVR Interaction
- Fee models: proportional fee `f` charged on notional or applied as liquidity top-up.
- Creator parameters include `f`; simulate expected LVR vs fee capture to choose `L`.

## 6. Parameters for Creators
- Required: expiry `T`, invariant mode (static|dynamic), liquidity scale `L_0`, fee `f`, oracle feed, min/max trade size, protection thresholds near expiry.
- Optional: governed liquidity schedule overrides, fee escalators near expiry.

## 7. Protections and Edge Cases
- Near expiry: throttle max Δ, increase fees, or switch to maker-only.
- Circuit breakers: stop on abnormal oracle or numerics.
- Liquidity starvation: prompt LPs to top up or widen protections.

## 8. Agents Appendix (pm-AMM)
- Goals: recommend `L_0` and `f` for target utilization and LVR; detect risky trades near expiry; explain slippage.
- Inputs: `(x, y, L, t, T, f)`, recent flow, oracle.
- Outputs: quotes with slippage bands; warnings; simple English explanation of price change and LP economics.
- Tools: quote endpoint; invariant solver; LVR simulator.
- Preconditions: market live, oracle healthy, wallet connected.
- Postconditions: transaction prepared or canceled with rationale.
- Failures: solver no-converge → fallback method; expiry threshold → throttle.
