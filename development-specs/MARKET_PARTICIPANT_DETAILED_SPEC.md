# Market Participant - Detailed User Stories & UI Flow

## Overview

Market participants can browse, analyze, trade on, and manage positions across distributional prediction markets. The interface provides tools for expressing nuanced probabilistic beliefs and optimizing trading strategies.

---

## Phase 1: Market Discovery & Browse

### Entry Point: Market Marketplace Dashboard

**UI Components:**

1. **Market Filter Sidebar** (Left)
   
   **Category Filters:**
   - Checkboxes: Crypto, Politics, Sports, Science, Economics, Technology
   - State: Unchecked → Checked (multi-select)
   - Effect: Real-time filtering of market list
   
   **Status Filters:**
   - Radio buttons: All, Active, Closing Soon (<24h), Recently Created, Resolved
   - Default: Active
   
   **Liquidity Range:**
   - Dual-handle slider: $0 - $1M+
   - Display: Current range values
   - Purpose: Filter out low-liquidity markets
   
   **Time to Resolution:**
   - Dropdown: Any, <1 day, 1-7 days, 1-4 weeks, 1-6 months, >6 months
   
   **Sort By:**
   - Dropdown: Volume (24h), Liquidity, Time Created, Popularity, Time to Resolution
   - Order toggle: Ascending/Descending

2. **Search Bar** (Top)
   - Type: Text input with autocomplete
   - Features: Search by title, description, creator, tags
   - Real-time results dropdown
   - Keyboard navigation support
   - Recent searches (if logged in)

3. **Market Grid/List View** (Main area)
   
   **Each Market Card Contains:**
   
   **Header:**
   - Market title (truncated, hover for full)
   - Category badge
   - Status indicator: 🟢 Active | 🟡 Closing Soon | ⚫ Resolved
   
   **Distribution Preview:**
   - Mini chart (100x60px) showing current consensus distribution
   - X-axis: Outcome range (labeled endpoints)
   - Y-axis: Probability (no labels, visual only)
   - Visual encoding: Color gradient based on probability density
   
   **Key Metrics:**
   - **24h Volume**: $X,XXX
   - **Total Liquidity**: $X,XXX  
   - **Participants**: XX traders
   - **Time to Resolution**: Countdown or "Resolved X days ago"
   
   **Interaction:**
   - Hover: Card elevates, shows "View Market" button
   - Click anywhere: Navigate to market detail page

4. **Featured Markets Carousel** (Top of page)
   - High-volume or editorial picks
   - Auto-rotating every 5 seconds
   - Manual navigation dots
   - "Explore All" link

---

## Phase 2: Market Analysis & Detail View

### Market Detail Page

**Layout:** 3-column responsive layout

#### Left Column: Market Information

1. **Market Header**
   - Full title
   - Creator info: Avatar, name, reputation score
   - Category tags (clickable, filter markets)
   - Share button: Twitter, copy link, embed code

2. **Event Description**
   - Full markdown-rendered description
   - Collapsible sections if long
   - Resolution criteria highlighted in callout box
   - Oracle info: Type, source, last update timestamp

3. **Market Stats Panel**
   - **Created**: Date & time
   - **Resolves**: Countdown timer or date
   - **Oracle**: Name with link
   - **Initial Liquidity**: $X,XXX (creator provided)
   - **Current Liquidity**: $X,XXX (total in pool)
   - **Total Volume**: $X,XXX (all-time)
   - **24h Volume**: $X,XXX
   - **Active Positions**: XX
   - **Your Position**: Shows if user has stake
   - **Fees**: Platform X% | Creator Y% | LP Z%

#### Center Column: Distribution Visualization & Trading

1. **Interactive Distribution Chart** (Primary feature)
   
   **Chart Area:**
   - Large (600x400px minimum)
   - X-axis: Outcome variable with gridlines
   - Y-axis: Probability density (0-100% or normalized)
   - Responsive to window size
   
   **Displayed Curves:**
   
   **Current Market Consensus** (Primary)
   - Line: Thick, solid, branded color (blue)
   - Represents: Aggregate distribution from all trades
   - Label: "Market Consensus"
   
   **Your Prediction** (If user makes one)
   - Line: Dashed, contrasting color (green)
   - Shows: User's proposed distribution
   - Label: "Your Prediction"
   - Toggle: Show/hide via checkbox
   
   **Initial Distribution** (Optional)
   - Line: Thin, dotted, gray
   - Shows: Creator's initial setup
   - Toggle: Show/hide
   
   **Profit/Loss Preview** (When trading)
   - Area fill: Green (potential profit) | Red (potential loss)
   - Calculated: Based on your prediction vs. market vs. various outcomes
   - Dynamic: Updates as user adjusts prediction
   
   **Interaction Methods:**
   
   **Method 1: Template Selection** (Beginner-friendly)
   - Dropdown above chart: "Start with a template"
   - Options: Uniform, Normal, Log-normal, Bimodal, Current Market (clone)
   - Effect: Populates "Your Prediction" with selected template
   
   **Method 2: Parameter Adjustment** (Intermediate)
   - Sliders panel (appears when template selected):
     - **Mean (μ)**: Slider spanning market range
     - **Standard Deviation (σ)**: Slider with visual bandwidth indicator
     - **Confidence**: Alternative to σ for less technical users
   - Real-time preview on chart
   - Distribution stats update live
   
   **Method 3: Direct Manipulation** (Advanced)
   - Click and drag on chart to draw curve
   - Control points: Add/remove by clicking
   - Smoothing toggle
   - Constraints: Auto-normalize to 100%, prevent invalid shapes
   - Undo/redo buttons
   
   **Method 4: Point-by-Point Input** (Expert)
   - Table view toggle
   - Rows: Outcome bins
   - Columns: Outcome value | Your probability | Market probability
   - Editable probability column
   - Auto-normalize button

2. **Trade Position Sizing Panel** (Below chart)
   
   **Position Size Input:**
   - Label: "How much do you want to trade?"
   - Input: Number with token selector (SOL/USDC/USDT)
   - Slider: Quick select (Min, 25%, 50%, 75%, Max)
   - Max: Based on wallet balance - gas
   - Validation: Real-time balance check
   
   **Collateral Calculator:**
   - Display: "Required collateral: $X,XXX"
   - Explanation tooltip: "Based on maximum possible loss across all outcomes"
   - Formula: max(|your_distribution - market_distribution|) × position_size
   - Visual: Bar showing collateral vs. position size
   
   **Expected Value Display:**
   - "Expected Profit/Loss: $X,XXX"
   - Breakdown: Best case, expected, worst case
   - Scenario table: Top 3 outcomes with probabilities
   
   **Fee Breakdown:**
   - Platform fee: $X
   - Creator fee: $Y
   - LP fee: $Z (paid to liquidity providers)
   - Total fees: $X+Y+Z
   - Effective fee rate: Z%

3. **Trade Execution Controls**
   
   **Trade Type Selector:**
   - Radio buttons:
     - **Market Order**: Execute immediately at current price
     - **Limit Order**: Execute when price reaches target
   
   **For Market Orders:**
   - Button: "Execute Trade" (large, primary action)
   - State: Enabled (valid) → Loading → Success/Error
   - Confirmation modal: "Review your trade"
     - Summary: Position size, distribution preview, fees, collateral
     - Checkbox: "I understand the risks"
     - Actions: "Confirm" | "Cancel"
   
   **For Limit Orders:**
   - Additional inputs:
     - Target price (or distribution threshold)
     - Expiration: Date-time picker or "Good til cancelled"
   - Button: "Place Limit Order"
   - Order placed → Added to your open orders list

4. **Quick Trade Buttons** (For simpler trades)
   
   **"Match Market" Button:**
   - One-click to allocate funds proportionally to current consensus
   - No prediction required, pure liquidity provision
   - Shows estimated LP rewards
   
   **"Bet High/Low" Buttons:**
   - Quick binary-like trades within distributional market
   - "Bet Higher": Weight distribution toward upper range
   - "Bet Lower": Weight distribution toward lower range
   - Simplified for casual traders

#### Right Column: Activity & Social

1. **Order Book View** (Tabbed)
   
   **Tab 1: Recent Trades**
   - Table showing last 20 trades:
     - Time (relative: "2m ago")
     - Type: Buy/Sell (color coded)
     - Amount: $X,XXX
     - Distribution shift: "↑2.3% toward $95k"
   - Real-time updates (WebSocket)
   - Animation: New rows fade in at top
   
   **Tab 2: Open Limit Orders**
   - Your open orders (if any)
   - All open orders (market depth)
   - Columns: Price, Amount, Total, Actions
   - Action: Cancel order (requires wallet signature)
   
   **Tab 3: Large Positions**
   - Whale watching: Positions > $10k
   - Anonymous but shows:
     - Position size
     - Distribution bias
     - Time entered
   - Purpose: Detect informed trading

2. **Leaderboard** (Collapsible)
   - Top 10 traders by profit (for this market)
   - Columns: Rank, Trader (anonymous ID), Profit, Accuracy Score
   - "See Full Leaderboard" link
   - Your rank highlighted if in top 100

3. **Discussion / Comments**
   - Threaded comments
   - Rich text editor
   - Upvote/downvote system
   - Sort: Top, Recent, Controversial
   - Filter: Show only verified traders (min stake)
   - Moderation: Report inappropriate content

4. **Related Markets**
   - Similar or correlated markets
   - "Also predicted by traders here"
   - Card preview with mini chart
   - Quick navigate

---

## Phase 3: Wallet Transaction & Position Management

### Transaction Flow (After clicking "Execute Trade")

**Step 1: Transaction Modal**
- Header: "Approve Transaction"
- Display: Transaction preview
  - Action: "Trade on [Market Title]"
  - Amount: X USDC
  - Collateral: Y USDC (locked until resolution)
  - Network fee: ~0.01 SOL
  - Total: X + Y USDC + 0.01 SOL
- Button: "Open Wallet"

**Step 2: Wallet Approval (External)**
- User switches to Phantom/Solflare
- Reviews transaction details
- Approves or Rejects

**Step 3: Transaction Status**

**If Approved:**
- Modal updates: "Submitting transaction..."
- Progress indicator: "Confirming (X/32 blocks)"
- State: Submitted → Confirmed → Finalized (typically 15-30 seconds)
- Visual: Animated progress bar

**If Finalized:**
- Modal: "✅ Trade Executed Successfully!"
- Display:
  - Position ID (copyable)
  - Transaction signature (link to Solscan)
  - Your new position summary
- Actions:
  - "View Position" → Navigate to portfolio
  - "Make Another Trade" → Reset form
  - "Close" → Return to market view

**If Rejected or Error:**
- Modal: Error details
- Common errors:
  - Insufficient balance
  - Slippage exceeded (market moved)
  - Network congestion
- Actions: "Retry" | "Adjust Trade" | "Cancel"

### Position Confirmation Update

**Market page updates:**
- Your position card appears in sidebar
- Distribution chart adds "Your Prediction" overlay
- Stats panel updates: "Your Position: $X,XXX"

---

## Phase 4: Portfolio & Position Management

### Portfolio Dashboard

**Entry:** Click "Portfolio" in main navigation

**Layout:** Table view with filters

**Filters:**
- Status: All, Active, Resolved, Profitable, Losing
- Time range: All time, Last 7 days, Last 30 days, Custom
- Market category: All, Crypto, Politics, etc.

**Main Table:**

**Columns:**
- **Market**: Title with mini icon
- **Your Prediction**: Mini chart preview
- **Market Consensus**: Mini chart preview
- **Position Size**: $X,XXX
- **Current P&L**: $X,XXX (+X.X%) color-coded green/red
- **Status**: Active, Resolved, Claiming
- **Time to Resolution**: Countdown or "Resolved"
- **Actions**: View, Add, Close, Claim (context-dependent)

**Expandable Rows:**
- Click row → Expands to show:
  - Detailed distribution comparison
  - Position history: Trades made, avg entry price
  - Collateral locked
  - Estimated payout scenarios
  - Quick actions: Add to position, Close position, Share

**Summary Cards (Top):**
1. **Total Portfolio Value**: $X,XXX
2. **Unrealized P&L**: $X,XXX (+X.X%)
3. **Realized P&L** (from resolved markets): $X,XXX
4. **Locked Collateral**: $X,XXX across Y markets
5. **Claimable Rewards**: $X,XXX (from resolved markets)

**Actions:**

**Bulk Actions:**
- "Claim All Rewards": One transaction to claim from all resolved markets
- "Export Portfolio": CSV download for tax/analysis

**Individual Position Actions:**

**Add to Position:**
- Opens trade modal pre-filled with current distribution
- Allows adding more capital to existing bet

**Modify Position:**
- Adjust distribution (costs fees + collateral adjustment)
- Increase/decrease size

**Close Position:**
- Sell back to market at current price
- Incurs fees
- Instant liquidity exit
- Confirmation: "Are you sure? Current P&L: -$X"

**Claim Rewards** (Resolved markets):
- Button appears when market resolved & you're profitable
- One-click claim to wallet
- Shows estimated gas cost

---

## Phase 5: AI-Assisted Trading (Advanced Feature)

### AI Agent Integration Panel

**Access:** Toggle "AI Assistant" in market view or portfolio

**UI Component:** Side panel or modal overlay

**Features:**

1. **Market Sentiment Analysis**
   - Display: "AI-detected sentiment: Bullish 68%"
   - Sources: Social media, news, on-chain activity
   - Confidence score
   - Update frequency: Real-time

2. **Optimal Distribution Suggestion**
   - AI analyzes:
     - Historical data
     - External market signals
     - Correlation with other markets
   - Output: Suggested distribution curve
   - Action: "Apply to Trade" (one-click import)
   - Explanation: "Why this distribution?" with reasoning

3. **Risk Assessment**
   - Analysis of your current position vs. market
   - Risk score: 1-10 (conservative to aggressive)
   - Diversification suggestions
   - Correlation warnings: "70% of your portfolio exposed to crypto"

4. **Auto-Rebalancing**
   - Toggle: Enable/Disable
   - Settings:
     - Rebalance frequency: Daily, Weekly, Custom
     - Max deviation threshold: X%
     - Max gas per rebalance: X SOL
   - Requires: Initial wallet approval (delegated authority)
   - Transparency: All actions logged and notify

5. **Arbitrage Opportunities**
   - Scanner: Detects inefficiencies across related markets
   - Alert: "Arbitrage detected: 3.2% spread between BTC markets"
   - Action: "Execute Arb" (places trades automatically if auto-mode enabled)

---

## Phase 6: Market Resolution & Claiming

### When Market Reaches Resolution Time

**Notification:**
- Email/push: "Market '[Title]' is resolving"
- In-app banner: "Resolution in progress..."

**Market Page Updates:**

**Status Banner:**
- "⏳ Awaiting Oracle Result"
- Or: "⏳ Dispute Period: X hours remaining"
- Or: "✅ Market Resolved"

**Outcome Display:**
- Large callout: "Final Outcome: $X,XXX" or "Date: MM/DD/YYYY"
- Chart: Vertical line marking actual outcome
- Overlays: Your prediction, market consensus, initial

**Your Position Status:**

**If Profitable:**
- Card: "🎉 You won $X,XXX! (+X% return)"
- Breakdown:
  - Initial stake: $A
  - Collateral returned: $B
  - Profit: $C
  - Total claimable: $A + $B + $C
- Button: "Claim Rewards" (large, primary)

**If Loss:**
- Card: "Position closed at loss: -$X,XXX"
- Explanation: "Market outcome was outside your predicted range"
- No action needed (collateral already settled)
- Learning: "View your prediction vs. actual"

**If Neutral/Partial:**
- Card: "Partial return: $X,XXX (X% of initial)"
- Explanation: Partial overlap with outcome distribution

**Claim Process:**

1. Click "Claim Rewards"
2. Wallet signature modal: "Claim $X,XXX from [Market]"
3. Transaction submits
4. Confirmation: "Funds sent to your wallet"
5. Update: Portfolio and wallet balance refresh

**Post-Resolution Analytics:**

**Your Performance Card:**
- Accuracy score: "85/100"
- Profit: $X,XXX
- ROI: X%
- Rank: #X out of Y participants
- Share buttons: "I earned $X on this prediction"

**Market Autopsy:**
- Chart: Prediction evolution over time (animated)
- Major trades visualization
- External events correlation
- "What traders got right/wrong"

---

## State Transition Summary

```
[Market Discovery]
    ↓ (Select Market)
[Market Detail View]
    ↓ (Design Prediction)
[Trade Configuration]
    ↓ (Execute Trade)
[Wallet Transaction]
    ↓ (Confirmation)
[Active Position]
    ↓ (Monitor in Portfolio)
[Market Resolution]
    ↓ (Outcome Published)
[Claim Rewards]
    ↓ (Funds Received)
[Completed]
```

## UI Component State Matrix

| Component | States | Validation/Feedback |
|-----------|--------|---------------------|
| Market Card | Default, Hover, Clicked | Elevation change, button reveal |
| Distribution Chart | View-only, Editing, Valid, Invalid | Curve feedback, normalization warning |
| Position Size Input | Empty, Partial, Valid, Exceeds Balance | Real-time balance check, error message |
| Execute Button | Disabled, Enabled, Loading, Success, Error | Color change, spinner, checkmark/X |
| Trade Modal | Reviewing, Approving, Submitted, Confirmed, Error | Multi-step progress indicator |
| Position Card | Active, Profitable, Losing, Resolved, Claimable | Color coding, badges |
| Claim Button | Hidden, Visible, Processing, Claimed | State-based rendering |

## Interaction Patterns

### Hover States
- Market cards: Elevate, show CTA
- Chart: Crosshair with tooltip (outcome value, probability)
- Buttons: Color shift, subtle scale

### Loading States
- Skeleton screens for market list
- Shimmer effect on loading cards
- Spinner for transactions
- Progress bars for multi-step processes

### Empty States
- Portfolio: "No positions yet. Browse markets to get started."
- Filters (no results): "No markets match your criteria. Try adjusting filters."
- Orders: "No open orders."

### Error States
- Inline validation: Red border, icon, message below field
- Toast notifications: Top-right, auto-dismiss after 5s
- Modal errors: Icon, message, action buttons

### Success States
- Toast: Green, checkmark, "Trade executed!"
- Confetti animation: On large profit claims
- Badge: "New" on recently entered positions

## Accessibility Considerations

- **Keyboard Navigation**: Full support, focus indicators
- **Screen Readers**: ARIA labels on charts, semantic HTML
- **Color Blind**: Not relying solely on red/green, using icons/patterns
- **Chart Alt Text**: "Distribution chart showing peak at $95k with 35% probability"
- **Mobile**: Touch-friendly hit targets (minimum 44x44px), responsive layouts

## Performance Optimizations

- **Lazy Loading**: Markets load as user scrolls
- **Chart Rendering**: Canvas-based for smooth 60fps
- **WebSocket**: Real-time updates without polling
- **Caching**: Market data cached for 30s, user positions cached locally
- **Optimistic UI**: Immediate feedback, rollback on error
