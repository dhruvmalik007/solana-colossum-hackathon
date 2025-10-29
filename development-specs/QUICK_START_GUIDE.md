# 🚀 Quick Start Guide - Distributional Prediction Markets

## 30-Second Overview

Build **distributional prediction markets** on Solana where traders express beliefs as probability distributions (not just yes/no), using an L² norm-based CFMM inspired by Paradigm's research and Metaculus's UX.

---

## 📁 Documentation Map

```
📦 development-specs/
│
├── 📘 README.md                    ← START HERE (navigation guide)
│
├── 📋 Core Specifications
│   ├── solana-onchain-protocol.md      (main architecture)
│   └── RESEARCH_SUMMARY.md             (research insights)
│
├── 👥 User Stories
│   ├── MARKET_CREATOR_DETAILED_SPEC.md     (10-phase creator flow)
│   └── MARKET_PARTICIPANT_DETAILED_SPEC.md (6-phase trader flow)
│
└── 🔧 Technical Deep Dives
    ├── MATHEMATICAL_FRAMEWORK.md       (L² CFMM formulas)
    ├── AI_AGENTIC_WORKFLOWS.md        (autonomous agents)
    └── HYBRID_ORDER_BOOK.md           (AMM + CLOB)
```

**Total**: 3,510 lines of specifications

---

## ⚡ 5-Minute Crash Course

### What Are Distributional Markets?

**Traditional**: "Will BTC be above $100k?" → Yes/No (binary)  
**Distributional**: "What will BTC price be?" → Full probability curve

**Example Distribution**:
```
Probability
    ↑
30% |     ╱‾‾‾╲
20% |   ╱       ╲
10% | ╱           ╲___
    └─────────────────→ BTC Price
     80k  100k  120k
```

### Core Innovation: L² Norm CFMM

**Invariant**: `‖f‖₂ = √(∫ f(x)² dx) = k`

**What it means**: Market maintains constant "energy" across all possible outcomes

**Key Properties**:
- Traders can shift distribution mean freely
- More confident predictions (lower σ) cost more
- Collateral = maximum possible loss

### User Experience

**Market Creator**:
1. Define event: "BTC price on Dec 31, 2025"
2. Draw initial distribution curve (interactive chart)
3. Set liquidity & fees
4. Deploy to Solana
5. Resolve when time comes

**Market Trader**:
1. Browse markets
2. Draw your prediction curve
3. System calculates collateral needed
4. Execute trade
5. Claim profit if you're right

---

## 🎯 Who Should Read What?

### Product Managers
1. **README.md** - Overview and navigation
2. **RESEARCH_SUMMARY.md** - Key insights and takeaways
3. **User story specs** - Understand user journeys

**Time**: 30 minutes

### Designers
1. **MARKET_CREATOR_DETAILED_SPEC.md** - All UI components
2. **MARKET_PARTICIPANT_DETAILED_SPEC.md** - Trading interface
3. Component state matrices - Interaction patterns

**Time**: 2 hours

### Frontend Developers
1. **solana-onchain-protocol.md** - Architecture overview
2. **User story specs** - UI requirements
3. Frontend tech stack section

**Time**: 3 hours

### Smart Contract Developers
1. **MATHEMATICAL_FRAMEWORK.md** - Core algorithms
2. **solana-onchain-protocol.md** - Contract architecture
3. **HYBRID_ORDER_BOOK.md** - Order matching logic

**Time**: 4 hours

### Quants/Researchers
1. **MATHEMATICAL_FRAMEWORK.md** - All formulas
2. **RESEARCH_SUMMARY.md** - Research synthesis
3. Paradigm paper (external link)

**Time**: 3 hours

### AI/ML Engineers
1. **AI_AGENTIC_WORKFLOWS.md** - Agent architecture
2. **MATHEMATICAL_FRAMEWORK.md** - Bayesian updating
3. Trading strategy algorithms

**Time**: 2 hours

---

## 🔑 Key Concepts

### 1. L² Norm CFMM
**What**: Constant function market maker using Euclidean distance
**Why**: Enables trading on continuous distributions
**Formula**: `‖f‖₂ = k`

### 2. Gaussian Pricing
**What**: Normal distribution N(μ, σ²) as tradeable asset
**Why**: Mathematically tractable, intuitive for users
**Formula**: `‖φ‖₂ = 1/(2σ√π)`

### 3. Collateralization
**What**: Trader posts max possible loss upfront
**Why**: Prevents market insolvency
**Formula**: `Collateral = -min_x[g(x) - f(x)]`

### 4. Hybrid Order Book
**What**: AMM (liquidity) + CLOB (price discovery)
**Why**: Best execution and always-available liquidity
**Flow**: CLOB first → AMM for remainder

### 5. AI Agents
**What**: Autonomous trading bots
**Why**: Exploit inefficiencies, provide liquidity
**Types**: Analysis, Execution, Risk, LP, Learning

---

## 📊 Implementation Checklist

### Phase 1: MVP (Months 1-2)

**Smart Contracts** (Anchor/Rust)
- [ ] Market factory program
- [ ] Gaussian distribution support
- [ ] Basic trading engine
- [ ] Manual oracle resolution

**Frontend** (Next.js)
- [ ] Market creation form
- [ ] Interactive distribution chart (D3.js)
- [ ] Trade execution panel
- [ ] Portfolio dashboard

**Infrastructure**
- [ ] Solana devnet deployment
- [ ] Wallet integration (Phantom)
- [ ] Basic indexer

### Phase 2: Enhanced (Months 3-4)

- [ ] CLOB integration
- [ ] Multiple distribution types
- [ ] Automated oracles (Chainlink/Pyth)
- [ ] Advanced analytics

### Phase 3: AI & Scale (Months 5-6)

- [ ] AI agent framework
- [ ] Automated market making
- [ ] Mobile app
- [ ] Mainnet launch

---

## 🛠️ Tech Stack

### Blockchain
- **Platform**: Solana
- **Framework**: Anchor
- **Language**: Rust

### Frontend
- **Framework**: Next.js 14
- **Blockchain**: @solana/web3.js
- **Charts**: D3.js / Recharts
- **Styling**: TailwindCSS + shadcn/ui
- **State**: Zustand

### Oracles
- Chainlink (crypto prices)
- Pyth Network (financial data)
- Manual (creator resolution)

---

## 💡 Quick Examples

### Create a Market (Pseudocode)

```typescript
const market = await createMarket({
  title: "BTC Price on Dec 31, 2025",
  outcomeRange: [80000, 120000],
  initialDistribution: {
    type: "gaussian",
    mean: 100000,
    stdDev: 10000
  },
  initialLiquidity: 10000, // USDC
  resolutionTime: new Date("2025-12-31"),
  oracle: "chainlink:BTC-USD"
});
```

### Execute a Trade (Pseudocode)

```typescript
const trade = await executeTrade({
  market: marketId,
  prediction: {
    type: "gaussian",
    mean: 105000,  // More bullish than market
    stdDev: 8000   // More confident
  },
  positionSize: 1000, // USDC
});

// System calculates:
// - Collateral required: ~$150
// - Expected profit if right: ~$200
// - Max loss: $150 (collateral)
```

### Calculate Collateral (Rust)

```rust
fn calculate_collateral(
    old_mean: f64, old_sigma: f64,
    new_mean: f64, new_sigma: f64,
    k: f64
) -> f64 {
    let critical_point = find_min_difference(
        old_mean, old_sigma, 
        new_mean, new_sigma
    );
    let min_value = gaussian_diff(
        critical_point, 
        old_mean, old_sigma, 
        new_mean, new_sigma, 
        k
    );
    -min_value.min(0.0)
}
```

---

## 🎨 UI/UX Highlights

### Distribution Chart (Core Component)

**Features**:
- Interactive curve drawing
- Template selection (Normal, Log-normal, Bimodal)
- Parameter sliders (μ, σ)
- Real-time normalization
- Profit/loss visualization

**States**:
- View-only (market consensus)
- Editing (user prediction)
- Valid (sum = 100%)
- Invalid (warning shown)

### Trade Panel

**Inputs**:
- Position size (USDC)
- Distribution parameters

**Outputs**:
- Collateral required
- Expected P&L
- Fee breakdown

**Actions**:
- Execute trade
- Save prediction
- Simulate outcomes

---

## 🔐 Security Highlights

### Smart Contract
- Minimum σ constraint (prevents bankruptcy)
- Collateral validation
- Invariant checks on every trade
- Reentrancy guards

### Economic
- Bounded loss for LPs
- Proper scoring rules (incentive alignment)
- Fee structure prevents manipulation

### Operational
- Multi-sig for admin functions
- Timelock for upgrades
- Emergency pause mechanism

---

## 📈 Success Metrics

### MVP Goals
- 10+ active markets
- 100+ traders
- $100k+ total volume
- <1% error rate in resolutions

### Phase 2 Goals
- 50+ markets
- 1,000+ traders
- $1M+ volume
- AI agents providing 20%+ liquidity

---

## 🔗 External Resources

### Must-Read
1. **Paradigm Distribution Markets**
   https://www.paradigm.xyz/2024/12/distribution-markets

2. **Metaculus Platform**
   https://www.metaculus.com

### Helpful
3. **Solana Cookbook**
   https://solanacookbook.com

4. **Anchor Book**
   https://book.anchor-lang.com

---

## ❓ FAQ

**Q: Why Solana?**  
A: High throughput, low fees, parallel processing ideal for order books

**Q: Why L² norm vs. LMSR?**  
A: L² supports continuous distributions, LMSR only discrete outcomes

**Q: How is this different from Polymarket?**  
A: Distributional (full curves) vs. binary (yes/no), permissionless creation

**Q: What's the minimum viable market?**  
A: Gaussian distribution, manual resolution, basic UI

**Q: Can users lose more than collateral?**  
A: No, max loss = collateral posted upfront

---

## 🚀 Get Started Now

1. **Read**: `development-specs/README.md`
2. **Explore**: User story documents
3. **Understand**: Mathematical framework
4. **Build**: Start with MVP checklist

**Questions?** Review the 3,510 lines of specs in `/development-specs/`

---

*Quick Start Guide v1.0*  
*For full details, see complete specifications*
