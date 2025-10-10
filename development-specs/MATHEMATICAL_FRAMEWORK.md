# Mathematical Framework for Distributional Prediction Markets

## Table of Contents
1. [L² Norm-Based CFMM](#l2-norm-cfmm)
2. [Gaussian Distribution Pricing](#gaussian-pricing)
3. [Collateralization Requirements](#collateralization)
4. [Trader Profit & Loss Functions](#profit-loss)
5. [Liquidity Provider Economics](#lp-economics)
6. [Market Scoring Rules](#scoring-rules)

---

## 1. L² Norm-Based Constant Function Market Maker {#l2-norm-cfmm}

### Overview

The core mechanism uses an L² (Euclidean) distance metric to maintain a constant invariant between probability distributions, enabling continuous trading over infinite outcome spaces.

### Discrete Case Foundation

For a discrete event with N outcomes, we create outcome tokens X₁, ..., Xₙ where token Xᵢ pays $1 if outcome i occurs.

**AMM Holdings Vector:**
```
h = k - x = (k - x₁, ..., k - xₙ)
```
Where:
- `k` = initial liquidity (in dollars)
- `x` = vector of tokens sold by AMM
- `h` = vector of tokens held by AMM

**Invariant Function:**
```
‖x‖₂ = √(Σᵢ₌₁ᴺ xᵢ²) = k
```

Equivalently:
```
‖k - h‖₂ = √(Σᵢ₌₁ᴺ (hᵢ - k)²) = k
```

This creates a hypersphere of radius k centered at point (k, ..., k) in ℝᴺ.

### Market Efficiency Condition

If the true probability distribution is p = (p₁, ..., pₙ), arbitrageurs minimize the AMM's expected value:

```
min_x (k - p·x)  subject to  ‖x‖₂ = k
```

Which simplifies to:
```
max_x (p·x)  subject to  ‖x‖₂ = k
```

By the Cauchy-Schwarz inequality, the optimal solution is:
```
x = k · (p / ‖p‖₂)
```

**Key Insight:** The market's position vector x is directly proportional to the true probability distribution p, scaled by the L² norm constraint.

### Continuous Case Extension

For continuous outcomes over ℝ, we represent positions as functions f: ℝ → ℝ⁺.

**Outcome Function Tokens:**
- f(x) represents the number of tokens held for outcome x
- If outcome x₀ occurs, holder receives f(x₀) dollars

**Constant Function (Minting/Redeeming):**
```
f(x) = b  (constant function)
```
Can be minted or redeemed for b dollars at any time.

**AMM Invariant:**
```
‖f‖₂ = √(∫₋∞^∞ f(x)² dx) = k
```

**AMM Holdings:**
```
h(x) = b - f(x)
```

Where:
- `b` = initial backing (liquidity)
- `f(x)` = function of tokens sold
- `k` = invariant constant

**Constraint:** Must ensure f(x) ≤ b for all x (solvency).

### Trading Mechanics

When a trader moves the market from f to g:

**Required Collateral:**
```
Collateral = -min_x [g(x) - f(x)]
```

This ensures the trader can cover maximum possible loss across all outcomes.

**Market Equilibrium:**

If true distribution is p(x), efficient market converges to:
```
f = λp  where  λ = k / ‖p‖₂
```

And:
```
λ = k / √(∫₋∞^∞ p(x)² dx)
```

---

## 2. Gaussian Distribution Pricing {#gaussian-pricing}

### Normal Distribution PDF

```
φ(x; μ, σ) = (1 / √(2πσ²)) · exp(-(x - μ)² / (2σ²))
```

Where:
- `μ` = mean (location parameter)
- `σ` = standard deviation (scale parameter)
- `σ²` = variance

### L² Norm of Gaussian

```
‖φ‖₂ = √(∫₋∞^∞ φ(x)² dx) = 1 / (2σ√π)
```

**Derivation:** Uses the Gaussian integral identity.

### Market Representation

If market-implied distribution is Normal(μ, σ²), the AMM holds:
```
f(x) = λ · φ(x; μ, σ)
```

Where the scaling factor is:
```
λ = k · ‖φ‖₂ = k / (2σ√π)
```

**Key Properties:**

1. **Mean Independence:** L² norm doesn't depend on μ, so traders can shift mean freely (with appropriate collateral).

2. **Variance Sensitivity:** Lower σ (more peaked distribution) → higher L² norm → less total probability mass sold.

### Parameter Trading

**Marginal Price for Mean Shift:**
```
Δμ = ∂I/∂μ = 2∫₋∞^∞ [f(x) - q(x)] · (∂f/∂μ) dx
```

Where q(x) is reference distribution.

**Marginal Price for Volatility Shift:**
```
Δσ = ∂I/∂σ = 2∫₋∞^∞ [f(x) - q(x)] · (∂f/∂σ) dx
```

**Partial Derivatives:**
```
∂φ/∂μ = φ(x) · (x - μ) / σ²

∂φ/∂σ = φ(x) · [(x - μ)² / σ³ - 1/σ]
```

### Backing Constraints

Maximum value of f(x) occurs at the peak (x = μ):
```
max f = λ / √(2πσ²) = k / (σ√π)
```

To ensure solvency (f(x) ≤ b for all x):
```
k / (σ√π) ≤ b

Therefore: σ ≥ k² / (b²√π)
```

**Minimum Standard Deviation:**
```
σ_min = k² / (b²√π)
```

This prevents traders from creating arbitrarily peaked distributions that could bankrupt the AMM.

### Collateralization for Gaussian Trades

When moving from Normal(μₚ, σₚ) to Normal(μᵧ, σᵧ):

**Collateral Required:**
```
C = -min_x [λ'φ(x; μᵧ, σᵧ) - λφ(x; μₚ, σₚ)]
```

Where:
- `λ = k · 2σₚ√π`
- `λ' = k · 2σᵧ√π`

**Closed Form (Approximate):**

For small parameter changes, use Taylor expansion. For large changes, numerical optimization required.

**Critical Point (Global Minimum):**

Occurs where first derivative equals zero:
```
λ'φ'(x; μᵧ, σᵧ) = λφ'(x; μₚ, σₚ)
```

Can be verified on-chain by checking:
1. First derivative = 0
2. Second derivative > 0 (local minimum)
3. Point is on opposite side of μᵧ from μₚ

---

## 3. Collateralization Requirements {#collateralization}

### General Principle

When trader moves market from state f to state g, they must post collateral equal to their maximum possible loss.

**Maximum Loss:**
```
L_max = -min_x [g(x) - f(x)]
```

**Interpretation:** Worst-case scenario across all possible outcomes x.

### Discrete Case

For discrete distributions p and q:
```
Collateral = -min_i [qᵢ - pᵢ] · Position_Size
```

### Continuous Case

For continuous distributions:
```
Collateral = -min_x [g(x) - f(x)] · Position_Size
```

**Numerical Computation:**

1. Sample the difference function g(x) - f(x) at discrete points
2. Find global minimum (may require optimization)
3. Verify minimum on-chain using derivative tests

### Path Integral Formulation

For small parameter changes (μ → μ + δμ, σ → σ + δσ):

```
Collateral = ∫_μ^(μ+δμ) Δμ dμ + ∫_σ^(σ+δσ) Δσ dσ
```

Where Δμ and Δσ are marginal prices (deltas) from Section 2.

### Dynamic Collateral Adjustment

As market moves, collateral requirements change:

**Increase Position:** Post additional collateral
**Decrease Position:** Reclaim excess collateral
**Market Movement:** May trigger margin calls if collateral falls below threshold

---

## 4. Trader Profit & Loss Functions {#profit-loss}

### Loss Function

Trader's loss is the L² distance between their final position and the true outcome:

```
L_trader = ∫₋∞^∞ [f_final(x) - p_true(x)]² dx
```

Where:
- `f_final(x)` = trader's final distribution position
- `p_true(x)` = actual outcome distribution (Dirac delta at resolution)

### Profit Calculation

If trader moves market from f_start to f_final:

**Profit:**
```
Π = ∫₋∞^∞ [f_start(x) - p_true(x)]² dx - ∫₋∞^∞ [f_final(x) - p_true(x)]² dx
```

**Interpretation:** Reduction in squared error = profit

**Simplified (for point outcome x₀):**

If outcome resolves to single value x₀:
```
Π = [f_start(x₀) - 1]² - [f_final(x₀) - 1]²
   = f_start(x₀)² - f_final(x₀)² + 2(f_final(x₀) - f_start(x₀))
```

### Expected Profit

Before resolution, trader's expected profit given their belief p_trader:

```
E[Π] = ∫₋∞^∞ p_trader(x) · [f_start(x) - f_final(x)] dx - Fees
```

### Kelly Criterion for Position Sizing

Optimal position size to maximize log utility:

```
f* = (p · b - 1) / (b - 1)
```

Where:
- `p` = trader's probability of winning
- `b` = odds (payout ratio)
- `f*` = fraction of bankroll to wager

**Adapted for Distributional Markets:**

```
Position_Size = Bankroll · ∫ [p_trader(x) - p_market(x)] · EV(x) dx
```

Where EV(x) is expected value if outcome is x.

---

## 5. Liquidity Provider Economics {#lp-economics}

### Liquidity Pool Composition

**Pool Reserves:**
```
R(x) = f(x) - q(x)
```

Where:
- `f(x)` = current market distribution function
- `q(x)` = reference/initial distribution

### Fee Structure

**Fee per Trade:**
```
Fee = φ · |Collateral_Required|
```

Where φ ∈ (0, 1) is the fee rate (e.g., 0.5% = 0.005).

**Fee Distribution:**
```
Platform_Fee = φ_platform · Trade_Size
Creator_Fee = φ_creator · Trade_Size
LP_Fee = (1 - φ_platform - φ_creator) · Trade_Size
```

**Example:**
- Platform: 0.3%
- Creator: 0.2%
- LP: 99.5%

### LP Reward Calculation

**Individual LP Share:**
```
Reward_i = (Liquidity_i / Total_Liquidity) · Total_Fees_Collected
```

**APY Estimation:**
```
APY = (Annual_Fees / Total_Liquidity) · 100%
```

### Impermanent Loss

LPs face risk if final outcome differs significantly from initial distribution:

**LP Loss:**
```
IL = Share_i · ∫₋∞^∞ [f_final(x) - p_true(x)]² dx
```

**Mitigation:**
- Diversification across multiple markets
- Dynamic fee adjustment based on volatility
- Withdrawal before high-uncertainty events

### LP Profit Formula

**Net LP Profit:**
```
Profit_LP = Fees_Earned - Impermanent_Loss - Gas_Costs
```

**Break-Even Condition:**
```
Fees_Earned ≥ Impermanent_Loss + Gas_Costs
```

### Liquidity Mining Incentives

**Additional Rewards:**
```
Mining_Reward = Base_Reward · (Your_Liquidity / Total_Liquidity) · Time_Factor
```

Where Time_Factor rewards longer-term LPs.

---

## 6. Market Scoring Rules {#scoring-rules}

### Logarithmic Market Scoring Rule (LMSR)

Alternative to CFMM, commonly used in prediction markets:

**Cost Function:**
```
C(q) = b · log(Σᵢ exp(qᵢ / b))
```

Where:
- `b` = liquidity parameter
- `qᵢ` = quantity of outcome i shares outstanding

**Price of Outcome i:**
```
pᵢ = ∂C/∂qᵢ = exp(qᵢ / b) / Σⱼ exp(qⱼ / b)
```

**Properties:**
- Prices always sum to 1
- Bounded loss: max loss = b · log(N)
- Proper scoring rule (incentivizes truthful reporting)

### Quadratic Scoring Rule

**Score Function:**
```
S(p, x) = 2p(x) - Σᵧ p(y)²
```

Where:
- `p` = reported probability distribution
- `x` = actual outcome

**Expected Score:**
```
E[S(p, x)] = Σₓ q(x) · [2p(x) - Σᵧ p(y)²]
```

Maximized when p = q (proper scoring rule).

### Brier Score (for Continuous Distributions)

**Continuous Brier Score:**
```
BS = ∫₋∞^∞ [p(x) - 1_{x=x₀}]² dx
```

Where 1_{x=x₀} is indicator function (1 at true outcome, 0 elsewhere).

**Simplified:**
```
BS = ∫₋∞^∞ p(x)² dx + 1 - 2p(x₀)
```

**Interpretation:** Lower score = better prediction.

---

## Implementation Formulas for Smart Contracts

### On-Chain Computations

**1. Gaussian PDF Evaluation:**
```rust
fn gaussian_pdf(x: f64, mu: f64, sigma: f64) -> f64 {
    let coefficient = 1.0 / (sigma * (2.0 * PI).sqrt());
    let exponent = -((x - mu).powi(2)) / (2.0 * sigma.powi(2));
    coefficient * exponent.exp()
}
```

**2. L² Norm (Numerical Integration):**
```rust
fn l2_norm_gaussian(sigma: f64) -> f64 {
    1.0 / (2.0 * sigma * PI.sqrt())
}
```

**3. Collateral Calculation:**
```rust
fn calculate_collateral(
    mu_old: f64, sigma_old: f64,
    mu_new: f64, sigma_new: f64,
    k: f64
) -> f64 {
    // Find minimum of difference function
    let critical_point = find_min_difference(mu_old, sigma_old, mu_new, sigma_new);
    let min_value = gaussian_diff(critical_point, mu_old, sigma_old, mu_new, sigma_new, k);
    -min_value.min(0.0) // Only negative values require collateral
}
```

**4. Trade Execution:**
```rust
fn execute_trade(
    market: &mut Market,
    new_mu: f64,
    new_sigma: f64,
    position_size: u64
) -> Result<Trade> {
    // Validate parameters
    require!(new_sigma >= market.sigma_min, "Sigma too small");
    
    // Calculate collateral
    let collateral = calculate_collateral(
        market.mu, market.sigma,
        new_mu, new_sigma,
        market.k
    );
    
    // Check user balance
    require!(user.balance >= position_size + collateral, "Insufficient balance");
    
    // Update market state
    market.mu = new_mu;
    market.sigma = new_sigma;
    
    // Lock collateral
    lock_collateral(user, collateral);
    
    Ok(Trade { ... })
}
```

---

## Numerical Considerations

### Precision Requirements

- **Floating Point:** Use f64 (64-bit) for intermediate calculations
- **On-Chain Storage:** Fixed-point arithmetic (e.g., 18 decimals)
- **Rounding:** Always round against the trader (conservative)

### Optimization Techniques

**1. Precomputed Tables:**
- Store Gaussian CDF values for common ranges
- Lookup table for L² norms at discrete σ values

**2. Approximations:**
- Taylor series for small parameter changes
- Polynomial approximations for PDF/CDF

**3. Caching:**
- Cache market state hash
- Invalidate only on state changes

### Gas Optimization (Solana)

- **Batch Operations:** Combine multiple trades in single transaction
- **State Compression:** Use compact data structures
- **Lazy Evaluation:** Compute values only when needed
- **Parallel Processing:** Leverage Solana's concurrent execution

---

## Security Considerations

### Attack Vectors

**1. Sandwich Attacks:**
- Frontrun large trades to profit from slippage
- **Mitigation:** Slippage limits, commit-reveal schemes

**2. Oracle Manipulation:**
- Manipulate external data feeds
- **Mitigation:** Multiple oracle sources, median aggregation

**3. Precision Exploits:**
- Exploit rounding errors for profit
- **Mitigation:** Conservative rounding, minimum trade sizes

### Invariant Checks

**On Every Trade:**
```rust
assert!(market.total_liquidity >= market.min_liquidity);
assert!(market.sigma >= market.sigma_min);
assert!(market.collateral_locked <= market.max_collateral);
assert!(sum_probabilities() ≈ 1.0); // Within tolerance
```

---

## References

1. Paradigm - Distribution Markets (2024)
2. Hanson, R. - Logarithmic Market Scoring Rules (2003)
3. Chen, Y. & Pennock, D. - A Utility Framework for Bounded-Loss Market Makers (2007)
4. Othman, A. et al. - A Practical Liquidity-Sensitive Automated Market Maker (2013)
