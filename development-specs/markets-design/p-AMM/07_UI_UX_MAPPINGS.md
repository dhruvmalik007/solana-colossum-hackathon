# UI/UX Mappings (Aligned to ux-story)

## 1. Creator Journeys
- Select mechanism (pm-AMM | Distribution) → Parameter form → Previews → Risk checks → Publish.
- pm-AMM form: `T`, `L0`, `dynamic_on`, `fee`, oracle, protections.
- Distribution form: family, prior `(μ, σ)`, `k` or `b`, `σ_min`, `σ_max`, fee, oracle.
- Previews:
  - pm-AMM: invariant curve; liquidity fingerprint vs CPMM/LMSR.
  - Distribution: prior curve; σ_min validation; budget utilization.
- Guardrails: validate ranges; explain LVR, σ bounds; suggest defaults.

## 2. Participant Journeys
- Market detail → education cards (mechanism, fees, risks).
- pm-AMM trade: side, size → quote (avg price, slippage, fee) → confirm.
- Distribution trade: target `(μ, σ)` → quote (cost, fee, collateral, constraints) → confirm.
- Near-expiry: UI warnings, throttles visible; maker-only notice when active.

## 3. Visuals & State
- Curves with tooltips; sliders for `(μ, σ)`; time-to-expiry badges.
- Error states for oracle issues and solver fallback; retry guidance.

## 4. Agents Integration
- Inline helpers: parameter advisors, risk warnings, copy that translates math into plain language.
- Telemetry to improve defaults and suggest fee/`L0` updates.
