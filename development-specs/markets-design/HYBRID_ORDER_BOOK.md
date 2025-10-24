# Hybrid Order Book Mechanics

## System Architecture

### Components

1. **AMM (Automated Market Maker)**: Base liquidity layer
2. **CLOB (Central Limit Order Book)**: Price discovery layer
3. **Matching Engine**: Hybrid order routing

### Solana-Specific Architecture

- **CLOB Program**: OpenBook-like order book implemented as on-chain accounts with price levels and FIFO queues that follow the mechanism of the [distributional market](./DISTRIBUTIONAL_MARKETS_PROGRAM_DESIGN.md).
    - **TODO**: explain how to implement this for end 2 end settlement process. first only describing the state diagram and then correspondingly upgrading the description with specifications

- **AMM Program**: CFMM for distributional trading as defined in `MATHEMATICAL_FRAMEWORK.md` with invariant and collateral rules.
    - **Router Program**: Entrypoint that validates intent, queries CLOB, and routes remainder to AMM, then settles via token program.
    - **Keeper Network**: Off-chain actors trigger maintenance (e.g., stop-loss trigger, expiry sweeps) via idempotent instructions.

### Accounts (PDAs):

```
MarketPDA         = seeds["market", market_symbol]
OrderBookPDA      = seeds["orderbook", MarketPDA]
AmmPoolPDA        = seeds["amm", MarketPDA]
VaultBasePDA      = seeds["vault", MarketPDA, mint]
UserPositionPDA   = seeds["position", MarketPDA, user]
OpenOrdersPDA     = seeds["oo", MarketPDA, user]
FeeVaultPDA       = seeds["fees", MarketPDA, mint]
StatsPDA          = seeds["stats", MarketPDA]
```

Mermaid (high-level routing):


## My understanding:
The below diagram is not correct and doesn't showcase the workflow of how the market creator creates the market ( i.e defining the CFMM maket listed in the common CLOB market) and how the : 

- [creator](MARKET_CREATOR_DETAILED_SPEC.md): creates the given market based on the given prediction question based on the given questonnaire and the initial prediction % of certain scenario. 

- [Participant](MARKET_PARTICIPANT_DETAILED_SPEC.md): invests in the given market listed in the CLOB and then does the arbitrage between the given possibilities existing as the continuous selection function. 

```mermaid
sequenceDiagram
  participant UI as Client UI
  participant RP as Router Program
  participant CLOB as CLOB Program
  participant AMM as AMM Program
  participant SPL as SPL Token

  UI->>RP: place_order(size, side, limit?)
  RP->>CLOB: match(best-effort)
  CLOB-->>RP: clob_fill {filled, remaining}
  alt remaining > 0
    RP->>AMM: swap_or_quote(remaining)
    AMM-->>RP: amm_fill {amount, fee}
  end
  RP->>SPL: settle transfers (buyer<->seller; fees->FeeVaultPDA)
  RP-->>UI: receipt {avg_price, total_fees}
```

## Order Matching Flow

```
Incoming Order
    ↓
[Check CLOB for matching orders]
    ↓
Partial/No Match?
    ↓
[Route remainder to AMM]
    ↓
Execute at AMM price
    ↓
Settlement
```

## Order Types

### 1. Market Orders

**Execution**: Immediate, best available price

```rust
pub fn execute_market_order(
    ctx: Context<MarketOrder>,
    size: u64,
    direction: OrderDirection,
) -> Result<()> {
    // Try CLOB first
    let clob_fill = match_against_clob(ctx, size, direction)?;
    
    // Route remainder to AMM
    if clob_fill.remaining > 0 {
        fill_from_amm(ctx, clob_fill.remaining, direction)?;
    }
    
    Ok(())
}
```

### 2. Limit Orders

**Execution**: At specified price or better

```rust
pub fn place_limit_order(
    ctx: Context<LimitOrder>,
    price: u64,
    size: u64,
    direction: OrderDirection,
) -> Result<()> {
    // Check for the current CLOB and corresponding market price. 
    let immediate_fill = try_immediate_match(ctx, price, size, direction)?;
    //TODO: define the description of the 
    // Add remainder to order book
    if immediate_fill.remaining > 0 {
        add_to_order_book(ctx, price, immediate_fill.remaining, direction)?;
    }
    
    Ok(())
}
```

### 3. Stop-Loss Orders

**Trigger**: When the prediction percentage for the given option (or for the overall range for which you've invested amount) crosses / drops below the threshold.

```rust
pub struct StopLossOrder {
    pub trigger_price: u64,
    pub size: u64,
    pub direction: OrderDirection,
    pub owner: Pubkey,
}

// Monitored by keeper network
fn check_stop_loss_triggers(market: &Market) {
    for order in market.stop_loss_orders {
        if market.current_price >= order.trigger_price {
            convert_to_market_order(order);
        }
    }
}
```

## Distribution-Specific Mechanics

### Trading on Probability Curves

Users trade on specific outcome ranges:

```rust
pub struct DistributionalOrder {
    pub outcome_range: (f64, f64),  // e.g., (95000, 100000) for BTC
    pub probability_weight: f64,     // How much probability to allocate
    pub size: u64,                   // Position size in USDC
}
```

### Partial Fills

```rust
pub fn partial_fill_logic(
    order: &Order,
    available_liquidity: u64,
) -> PartialFill {
    let filled_amount = min(order.size, available_liquidity);
    let remaining = order.size - filled_amount;
    
    PartialFill {
        filled: filled_amount,
        remaining,
        avg_price: calculate_vwap(filled_amount),
    }
}
```

## Fee Structure

### Maker-Taker Model

```rust
pub struct FeeSchedule {
    pub maker_fee: u16,  // 0.1% = 10 basis points
    pub taker_fee: u16,  // 0.3% = 30 basis points
    pub amm_fee: u16,    // 0.5% = 50 basis points
}

fn calculate_fees(fill: &Fill, fee_schedule: &FeeSchedule) -> Fees {
    let clob_fees = if fill.is_maker {
        fill.clob_amount * fee_schedule.maker_fee / 10000
    } else {
        fill.clob_amount * fee_schedule.taker_fee / 10000
    };
    
    let amm_fees = fill.amm_amount * fee_schedule.amm_fee / 10000;
    
    Fees {
        clob: clob_fees,
        amm: amm_fees,
        total: clob_fees + amm_fees,
    }
}
```

## Solana Implementation

### Order Book Data Structure

```rust
#[account]
pub struct OrderBook {
    pub market: Pubkey,
    pub bids: Vec<Order>,  // Sorted descending by price
    pub asks: Vec<Order>,  // Sorted ascending by price
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Order {
    pub owner: Pubkey,
    pub price: u64,
    pub size: u64,
    pub timestamp: i64,
    pub order_id: u64,
}
```

### State Compression

Use Merkle trees for efficient order book storage:

```rust
pub struct CompressedOrderBook {
    pub merkle_root: [u8; 32],
    pub leaf_count: u64,
    pub max_depth: u8,
}
```

### Parallel Processing

Leverage Solana's concurrent execution (for adding based on the given indexed positions on the specific theme:-> similar to the way metacalculus defines the questions on the specific themes  and the competitions that sponsor those themes prediction).

```rust
// Multiple orders can be processed in parallel if they don't conflict
pub fn process_orders_batch(
    ctx: Context<BatchProcess>,
    orders: Vec<OrderInstruction>,
) -> Result<()> {
    for order in orders {
        // Each order processed independently
        process_single_order(ctx, order)?;
    }
    Ok(())
}
```

## Settlement Mechanics

### Atomic Settlement: 
- done just after the resolution of the market, or if the user wants to trade the position on the given question at the particular time. 

```rust
pub fn settle_trade(
    ctx: Context<Settlement>,
    fill: Fill,
) -> Result<()> {
    // Transfer tokens
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer_token_account.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            },
        ),
        fill.amount,
    )?;
    
    // Update positions
    update_position(ctx.accounts.buyer, fill.amount, PositionDirection::Long)?;
    update_position(ctx.accounts.seller, fill.amount, PositionDirection::Short)?;
    
    // Lock collateral
    lock_collateral(ctx, calculate_required_collateral(&fill))?;
    
    Ok(())
}
```

### Post-Trade Processing

```rust
pub fn post_trade_hook(trade: &Trade) -> Result<()> {
    // Update market statistics
    update_volume_stats(trade)?;
    
    // Emit event for off-chain indexing
    emit!(TradeEvent {
        market: trade.market,
        size: trade.size,
        price: trade.price,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    // Check if any stop-loss orders triggered
    check_stop_loss_triggers(trade.market)?;
    
    Ok(())
}
```

## Performance Optimizations

### Order Book Indexing

- **Price Levels**: Hash map for O(1) price lookup
- **User Orders**: Index by user for fast cancellation
- **Time Priority**: FIFO queue within each price level

### Caching Strategy

```rust
pub struct OrderBookCache {
    pub best_bid: Option<u64>,
    pub best_ask: Option<u64>,
    pub mid_price: u64,
    pub spread: u64,
    pub last_update: i64,
}

// Invalidate cache on any order book modification
fn invalidate_cache(cache: &mut OrderBookCache) {
    cache.last_update = 0;
}
```

### Gas Optimization

- **Batch Cancellations**: Cancel multiple orders in one transaction
- **Order Expiry**: Automatic cleanup of expired orders
- **Lazy Evaluation**: Compute values only when needed

## Market Depth Visualization

Users see aggregated liquidity:

TODO: -> i think the market depth should be looking more dynamic in terms of the volume market depth distributed across the distribution of the market depth , and thus doing the order matching and the UX showcase is also gonna change. 



```
Price    | Bid Size | Ask Size | Cumulative
---------|----------|----------|------------
$99,500  |   1,000  |          |   1,000
$99,000  |   2,500  |          |   3,500
$98,500  |   5,000  |          |   8,500
---------|----------|----------|------------
$100,000 | [Market Price]      |
---------|----------|----------|------------
$100,500 |          |   4,000  |   4,000
$101,000 |          |   3,000  |   7,000
$101,500 |          |   2,000  |   9,000
```

## Error Handling

:-> same as that before: you need to define more precise error codes based on the various error conditions that can occur both due to: 
- 1. both user stories
- 2. and the onchain errors. 


```rust
#[error_code]
pub enum OrderBookError {
    #[msg("Order size too small")]
    OrderTooSmall,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Order book full")]
    OrderBookFull,
    #[msg("Order not found")]
    OrderNotFound,
    #[msg("Unauthorized cancellation")]
    UnauthorizedCancel,
}
```
