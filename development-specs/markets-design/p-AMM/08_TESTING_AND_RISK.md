# Testing, Simulation, and Risk Management

## 1. Unit Tests
- pm-AMM invariant solver across price grid and `t → T` edge.
- Φ/ϕ approximations vs reference; fixed-point rounding bounds.
- Distribution L2 calculations; σ_min enforcement; collateral numerics.

## 2. Property-Based Tests
- No invariant violations; monotonicity of quote costs; bounded payouts.

## 3. Simulation
- LP wealth vs fees under static/dynamic schedules; flow scenarios.
- Trader strategies with noisy beliefs; market responsiveness.

## 4. Integration & E2E
- Program + API + UI quoting/execution flows; settlement and payouts.

## 5. Monitoring
- Quote error rate; solver fallbacks; near-expiry throttle triggers; oracle latency.

## 6. Risk Register
- Numerics (tails, underflow/overflow); oracle manipulation; expiry rush; parameter griefing (too-small σ proposals → guarded); DoS via heavy quotes.
- Mitigations: strict constraints, caching/LUTs, bounded iterations, admin pause, rate limits, audits.
