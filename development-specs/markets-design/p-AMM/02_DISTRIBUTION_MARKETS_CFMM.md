# Distribution Markets – Constant L2 CFMM over Functions

## 1. Intuition
- Market aggregates a full probability distribution over outcomes (continuous domain).
- Traders move the distribution; profits arise from reducing scoring-rule loss.

## 2. Discrete Case (for intuition)
- Outcome tokens `X_1..X_N`; AMM constant function is L2 norm on `x` (positions sold).
- Optimal aggregate position `x` aligns with true distribution `p` (Cauchy–Schwarz), hence AMM reserves encode market belief.

## 3. Continuous Case (main contribution)
- Positions are functions `f(x) ≥ 0` with payoff `f(x_0)` at resolution `x_0`.
- Mint/redeem flat function: `f(x) = b` ↔ `b` dollars (budget baseline).
- AMM invariant: constant L2 norm `||f||_2 = k` with solvency constraints.

## 4. Gaussian Specialization
- Restrict market family to Normal PDFs: `p(x; μ, σ)`.
- Position `f = λ p` (scalar multiple of PDF). L2 norm `||f||_2 = λ ||p||_2`, where `||p||_2 ∝ 1/√σ`.
- Backing constraint: `max_x f(x) ≤ b` ⇒ implies `σ ≥ σ_min(k, b)`; prevents insolvency from spikes.

## 5. Trading and Collateralization
- Moving from `f` to `g` requires collateral `C = -min_x { g(x) - f(x) }`.
- For Normal→Normal, compute minimum numerically:
  - Solve for stationary points of `g - f` using derivative roots; evaluate candidates and boundaries.
  - Verify on-chain via derivative checks and dust thresholds.

## 6. Implementation Notes
- Parameters for creators: prior family (Normal|Uniform), initial `(μ, σ)`, `k` (or budget `b`), fee `f`, σ bounds, resolution oracle.
- Pricing: cost to move is function of L2 norm change plus fee; quotes derived from differential of norm subject to constraints.
- Solana numerics: fixed-point PDF/CDF approximations; bounded domain windows; caching.

## 7. Agents Appendix (Distribution Markets)
- Goals: coach on `(μ, σ)` selection; prevent σ below bound; explain collateral requirement and capped payouts.
- Inputs: current `f` (summarized by `(μ, σ, λ)`), `k`/`b`, constraints, oracle.
- Outputs: quote, required collateral, warnings on extreme proposals.
- Tools: collateral numeric solver; PDF/L2 approximations; constraint checker.
- Preconditions: family allowed; σ ≥ σ_min; wallet connected.
- Postconditions: trade prepared with escrowed collateral; UI updated.
- Failures: numerics unstable → refine grid; constraint violation → reject with explanation.
