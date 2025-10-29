# Fees, LVR, and Liquidity Schedules

## 1. LVR in pm-AMM
- Static pm-AMM expected LVR per unit time: `LVR_t = V_t / (2 (T - t))`.
- Expected pool value decay: `E[V_t] ∝ sqrt(T - t)`.
- Dynamic pm-AMM with `L_t = L_0 * sqrt(T - t)` leads to constant expected LVR rate over time and linear decay of `E[V_t]` net withdrawals.

## 2. Fee Design
- Proportional fee `f` on notional, or fee as liquidity top-up.
- Calibrate `f` to offset expected LVR under assumed flow and volatility.
- Optional: fee escalators when `T - t` below thresholds; maker-only near expiry.

## 3. Liquidity Scheduling
- Static: simpler UX; rising per-dollar LVR near expiry.
- Dynamic: predictable LVR rate; lower liquidity late; can be governed or rule-based.
- LP tools: scheduled withdrawals; utilization targets; alerts.

## 4. Simulation and Calibration
- Inputs: historical flow, noise-trader ratio, volatility proxy.
- Outputs: fee band recommendations; `L_0` sizing; near-expiry protections.
- Methods: Monte Carlo on score dynamics; discrete time approximations to assess LP wealth and fee capture.

## 5. Distribution CFMM Considerations
- L2 norm changes determine fundamental cost; fees layer atop.
- σ-bound controls concentration risk; collateral floors prevent insolvency.
- Parameter sweeps to target desired cost-to-move at typical deltas in `(μ, σ)`.
