use anchor_lang::prelude::*;
pub mod math;
use math::effective_liquidity;

// TODO: Replace with your deployed program ID later
declare_id!("8ADZwnjeRCQ9Zkeafqb7XhmtEWC1XtVEajATzrtTr1nu");

#[program]
pub mod solana_prediction {
    use super::*;

    // Initialize a registry controlled by an authority
    pub fn init_registry(ctx: Context<InitRegistry>) -> Result<()> {
        let reg = &mut ctx.accounts.registry;
        reg.authority = ctx.accounts.authority.key();
        reg.bump = ctx.bumps.registry;
        Ok(())
    }

    // Add (or update) a strategy mapping: key -> target program id
    pub fn upsert_strategy(ctx: Context<UpsertStrategy>, strategy_key: [u8; 32], target_program: Pubkey) -> Result<()> {
        require_keys_eq!(ctx.accounts.registry.authority, ctx.accounts.authority.key(), ErrorCode::Unauthorized);
        let strat = &mut ctx.accounts.strategy;
        strat.registry = ctx.accounts.registry.key();
        strat.strategy_key = strategy_key;
        strat.target_program = target_program;
        strat.bump = ctx.bumps.strategy;
        Ok(())
    }

    // Minimal gated execution stub. For a safe template, we only emit an event after checks.
    // Extending to CPI requires passing account metas + instruction data and doing invoke_signed.
    pub fn execute_strategy(
        ctx: Context<ExecuteStrategy>,
        strategy_key: [u8; 32],
        approved: bool,
        _ix_data: Vec<u8>, // placeholder for future CPI payload
    ) -> Result<()> {
        require!(approved, ErrorCode::NotApproved);
        let strat = &ctx.accounts.strategy;
        require!(strat.strategy_key == strategy_key, ErrorCode::StrategyKeyMismatch);
        // Safety: For the starter template, we do not perform CPI. We only emit an event.
        emit!(StrategyExecutionRequested {
            user: ctx.accounts.user.key(),
            strategy: strategy_key,
            target_program: strat.target_program,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    // ========== Distributional Markets (Scaffold) ==========

    pub fn create_market(
        ctx: Context<CreateMarket>,
        params: MarketParams,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.slug = params.slug;
        market.market_type = 0; // distributional
        market.outcome_min = params.outcome_min;
        market.outcome_max = params.outcome_max;
        market.unit = params.unit;
        market.dist_type = params.dist_type;
        market.mu = params.mu;
        market.sigma = params.sigma;
        market.sigma_min = params.sigma_min;
        market.step = params.step;
        market.resolution_time = params.resolution_time;
        market.oracle_config = params.oracle_config;
        market.fee_bps_platform = params.fee_bps_platform;
        market.fee_bps_creator = params.fee_bps_creator;
        market.status = 0;
        market.bump = ctx.bumps.market;

        emit!(MarketCreated {
            market: market.key(),
            authority: market.authority,
            slug: market.slug,
            outcome_min: market.outcome_min,
            outcome_max: market.outcome_max,
            unit: market.unit,
            ts: Clock::get()?.unix_timestamp,
        });
        // Lightweight indexer-friendly log
        msg!(
            "IDX:MarketCreated|market={}|ts={}",
            market.key(),
            Clock::get()?.unix_timestamp
        );
        Ok(())
    }

    pub fn initialize_market_infrastructure(
        ctx: Context<InitializeMarketInfrastructure>,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.liquidity_pool = ctx.accounts.liquidity_pool.key();
        market.order_book = ctx.accounts.order_book.key();
        market.collateral_vault = ctx.accounts.collateral_vault.key();

        let lp = &mut ctx.accounts.liquidity_pool;
        lp.market = market.key();
        lp.vault = ctx.accounts.collateral_vault.key();
        lp.total_liquidity = 0;
        lp.bump = ctx.bumps.liquidity_pool;

        let ob = &mut ctx.accounts.order_book;
        ob.market = market.key();
        ob.best_bid = 0.0;
        ob.best_ask = 0.0;
        ob.event_counter = 0;
        ob.bump = ctx.bumps.order_book;

        let cv = &mut ctx.accounts.collateral_vault;
        cv.market = market.key();
        cv.bump = ctx.bumps.collateral_vault;

        emit!(MarketInfrastructureInitialized {
            market: market.key(),
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn place_limit_order(
        ctx: Context<PlaceLimitOrder>,
        side: u8,
        price_bps: u64,
        size: u64,
        _expiry: i64,
    ) -> Result<()> {
        let ob = &mut ctx.accounts.order_book;
        let order_id = ob.event_counter;
        ob.event_counter += 1;
        
        // CLOB: insert into price level (simplified; real impl uses heap/queue per level)
        if side == 0 { // Buy
            if price_bps as f64 / 10000.0 > ob.best_bid {
                ob.best_bid = price_bps as f64 / 10000.0;
            }
        } else { // Sell
            let ask_price = price_bps as f64 / 10000.0;
            if ob.best_ask == 0.0 || ask_price < ob.best_ask {
                ob.best_ask = ask_price;
            }
        }
        
        emit!(OrderPlaced { 
            order_id, 
            market: ctx.accounts.market.key(), 
            owner: ctx.accounts.owner.key(), 
            side, 
            price_bps, 
            size, 
            ts: Clock::get()?.unix_timestamp 
        });
        msg!(
            "IDX:OrderPlaced|market={}|order_id={}|side={}|price_bps={}|size={}|ts={}",
            ctx.accounts.market.key(),
            order_id,
            side,
            price_bps,
            size,
            Clock::get()?.unix_timestamp
        );
        Ok(())
    }

    pub fn execute_market_order(
        ctx: Context<ExecuteMarketOrder>,
        side: u8,
        size: u64,
    ) -> Result<()> {
        // Router logic: try CLOB first, then AMM
        let ob = &ctx.accounts.order_book;
        let price = if side == 0 { ob.best_ask } else { ob.best_bid };
        let price_bps = (price * 10000.0) as u64;
        
        // Simplified: assume full fill from AMM if CLOB empty
        // Real impl: partial fills, update grid distribution per MATHEMATICAL_FRAMEWORK.md
        
        emit!(TradeExecuted { 
            market: ctx.accounts.market.key(), 
            taker: ctx.accounts.taker.key(), 
            side, 
            price_bps, 
            size, 
            ts: Clock::get()?.unix_timestamp 
        });
        msg!(
            "IDX:TradeExecuted|market={}|taker={}|side={}|price_bps={}|size={}|ts={}",
            ctx.accounts.market.key(),
            ctx.accounts.taker.key(),
            side,
            price_bps,
            size,
            Clock::get()?.unix_timestamp
        );
        Ok(())
    }

    pub fn cancel_order(_ctx: Context<CancelOrder>, _order_id: u64) -> Result<()> {
        emit!(OrderCancelled { order_id: _order_id, ts: Clock::get()?.unix_timestamp });
        Ok(())
    }

    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        outcome_value: f64,
        _proof: Vec<u8>,
    ) -> Result<()> {
        // Pyth oracle validation per ORACLE_RESOLUTION_FLOW.md:
        // - Check status == Trading
        // - staleness: now - publish_time <= STALENESS_LIMIT
        // - confidence <= MAX_CONFIDENCE
        // - normalize: price * 10^exponent
        // For now, accept outcome_value directly (Pyth account parsing to be added)
        
        let market = &mut ctx.accounts.market;
        require!(market.status == 0 || market.status == 1, ErrorCode::MarketNotActive);
        market.status = 2; // resolved
        
        emit!(MarketResolved { 
            market: market.key(), 
            outcome_value, 
            ts: Clock::get()?.unix_timestamp 
        });
        Ok(())
    }

    pub fn claim_payout(_ctx: Context<ClaimPayout>) -> Result<()> {
        emit!(PayoutClaimed { owner: Pubkey::default(), market: Pubkey::default(), amount: 0, ts: Clock::get()?.unix_timestamp });
        Ok(())
    }

    // ====== Users & Positions ======

    pub fn init_user(ctx: Context<InitUser>) -> Result<()> {
        let user = &mut ctx.accounts.user_profile;
        user.owner = ctx.accounts.owner.key();
        user.open_positions = 0;
        user.bump = ctx.bumps.user_profile;
        Ok(())
    }

    pub fn open_position(
        ctx: Context<OpenPosition>,
        size: u64,
        collateral_locked: u64,
    ) -> Result<()> {
        let pos = &mut ctx.accounts.position;
        pos.owner = ctx.accounts.owner.key();
        pos.market = ctx.accounts.market.key();
        pos.size = size;
        pos.collateral_locked = collateral_locked;
        pos.entry_ts = Clock::get()?.unix_timestamp;
        pos.realized_pnl = 0;
        pos.bump = ctx.bumps.position;

        let user = &mut ctx.accounts.user_profile;
        user.open_positions = user.open_positions.saturating_add(1);

        emit!(PositionOpened {
            owner: pos.owner,
            market: pos.market,
            size,
            collateral_locked,
            ts: pos.entry_ts,
        });
        Ok(())
    }

    pub fn adjust_position(
        ctx: Context<AdjustPosition>,
        delta_size: i64,
        delta_collateral: i64,
    ) -> Result<()> {
        let pos = &mut ctx.accounts.position;
        // size is u64; apply delta with saturation and conservative rounding
        let new_size = if delta_size >= 0 {
            pos.size.saturating_add(delta_size as u64)
        } else {
            pos.size.saturating_sub(delta_size.unsigned_abs())
        };
        pos.size = new_size;

        let new_collateral = if delta_collateral >= 0 {
            pos.collateral_locked.saturating_add(delta_collateral as u64)
        } else {
            pos.collateral_locked.saturating_sub(delta_collateral.unsigned_abs())
        };
        pos.collateral_locked = new_collateral;

        emit!(PositionAdjusted {
            owner: pos.owner,
            market: pos.market,
            delta_size,
            delta_collateral,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
        let pos = &mut ctx.accounts.position;
        let user = &mut ctx.accounts.user_profile;
        if user.open_positions > 0 { user.open_positions -= 1; }

        emit!(PositionClosed {
            owner: pos.owner,
            market: pos.market,
            size: pos.size,
            collateral_locked: pos.collateral_locked,
            realized_pnl: pos.realized_pnl,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    // ====== Liquidity (Pool counters only; token transfers added later) ======

    pub fn add_liquidity(ctx: Context<AddLiquidity>, amount: u64) -> Result<()> {
        let lp = &mut ctx.accounts.liquidity_pool;
        lp.total_liquidity = lp.total_liquidity.saturating_add(amount);
        emit!(LiquidityAdded { market: lp.market, provider: ctx.accounts.provider.key(), amount, ts: Clock::get()?.unix_timestamp });
        Ok(())
    }

    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, amount: u64) -> Result<()> {
        let lp = &mut ctx.accounts.liquidity_pool;
        require!(lp.total_liquidity >= amount, ErrorCode::MarketNotActive); // reuse error for brevity
        lp.total_liquidity -= amount;
        emit!(LiquidityRemoved { market: lp.market, provider: ctx.accounts.provider.key(), amount, ts: Clock::get()?.unix_timestamp });
        Ok(())
    }

    // ====== pm-AMM (Scaffold) ======

    pub fn init_pmamm(
        ctx: Context<InitPmAmm>,
        l0: u64,
        dynamic_on: bool,
        fee_bps: u16,
        expiry_ts: i64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pmamm_pool;
        pool.market = ctx.accounts.market.key();
        // Initialize virtual-like reserves split by l0 to avoid division by zero
        pool.x = l0 / 2;
        pool.y = l0 - pool.x;
        pool.l0 = l0;
        pool.dynamic_on = if dynamic_on { 1 } else { 0 };
        pool.fee_bps = fee_bps;
        pool.expiry_ts = expiry_ts;
        pool.bump = ctx.bumps.pmamm_pool;

        emit!(PmAmmInitialized { 
            market: pool.market, 
            l0, 
            dynamic_on: pool.dynamic_on, 
            fee_bps, 
            expiry_ts, 
            ts: Clock::get()?.unix_timestamp 
        });
        msg!(
            "IDX:PmAmmInitialized|market={}|l0={}|dynamic_on={}|fee_bps={}|expiry_ts={}|ts={}",
            pool.market,
            l0,
            pool.dynamic_on,
            fee_bps,
            expiry_ts,
            Clock::get()?.unix_timestamp
        );
        Ok(())
    }

    pub fn trade_pmamm(
        ctx: Context<TradePmAmm>,
        side: u8,
        size: u64,
    ) -> Result<()> {
        require!(size > 0, ErrorCode::MarketNotActive); // reuse
        let pool = &mut ctx.accounts.pmamm_pool;
        let now = Clock::get()?.unix_timestamp;
        let l_eff = effective_liquidity(pool.l0, pool.dynamic_on, pool.expiry_ts, now);

        // Virtual reserves (prevent zero and control slippage)
        let mut vx = pool.x as f64 + l_eff / 2.0;
        let mut vy = pool.y as f64 + l_eff / 2.0;
        // Constant product invariant
        let k = vx * vy;

        let s = size as f64;
        require!(now < pool.expiry_ts, ErrorCode::MarketNotActive);
        let delta_y: f64;
        if side == 0 {
            // Buy X: remove X from pool, pay Y to pool
            let max_buy = (vx - 1.0).max(0.0); // leave 1 unit to avoid div-by-zero
            let buy = s.min(max_buy);
            let new_vx = (vx - buy).max(1.0);
            let new_vy = k / new_vx;
            delta_y = (new_vy - vy).max(0.0);
            // vx = new_vx; // Not used after
            // vy = new_vy; // Not used after
            // Fees accrue to pool; buyer pays delta_y + fee
            let fee = (delta_y * (pool.fee_bps as f64) / 10_000.0).max(0.0);
            let add_y = (delta_y + fee).max(0.0) as u64;
            pool.x = pool.x.saturating_sub(buy as u64);
            pool.y = pool.y.saturating_add(add_y);
            let avg_price = if s > 0.0 { (delta_y + fee) / s } else { 0.0 };
            let price_bps = (avg_price * 10_000.0) as u64;
            emit!(TradeExecuted {
                market: ctx.accounts.market.key(),
                taker: ctx.accounts.taker.key(),
                side,
                price_bps,
                size,
                ts: now,
            });
            msg!(
                "IDX:TradeExecuted|market={}|taker={}|side={}|price_bps={}|size={}|ts={}",
                ctx.accounts.market.key(),
                ctx.accounts.taker.key(),
                side,
                price_bps,
                size,
                now
            );
        } else {
            // Sell X: add X to pool, receive Y from pool
            let new_vx = vx + s;
            let new_vy = (k / new_vx).max(0.0);
            delta_y = (vy - new_vy).max(0.0);
            // vx = new_vx; // Not used after
            // vy = new_vy; // Not used after
            // Seller receives delta_y - fee; pool keeps fee
            let fee = (delta_y * (pool.fee_bps as f64) / 10_000.0).max(0.0);
            let payout = (delta_y - fee).max(0.0) as u64;
            pool.x = pool.x.saturating_add(s as u64);
            pool.y = pool.y.saturating_sub(payout);
            let avg_price = if s > 0.0 { (delta_y - fee).max(0.0) / s } else { 0.0 };
            let price_bps = (avg_price * 10_000.0) as u64;
            emit!(TradeExecuted {
                market: ctx.accounts.market.key(),
                taker: ctx.accounts.taker.key(),
                side,
                price_bps,
                size,
                ts: now,
            });
            msg!(
                "IDX:TradeExecuted|market={}|taker={}|side={}|price_bps={}|size={}|ts={}",
                ctx.accounts.market.key(),
                ctx.accounts.taker.key(),
                side,
                price_bps,
                size,
                now
            );
        }
        Ok(())
    }
}

// Accounts
#[derive(Accounts)]
pub struct InitRegistry<'info> {
    #[account(
        init,
        seeds = [b"registry", authority.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + Registry::SIZE,
    )]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(strategy_key: [u8; 32])]
pub struct UpsertStrategy<'info> {
    #[account(
        mut,
        seeds = [b"registry", authority.key().as_ref()],
        bump = registry.bump,
    )]
    pub registry: Account<'info, Registry>,
    #[account(
        init_if_needed,
        seeds = [b"strategy", registry.key().as_ref(), &strategy_key],
        bump,
        payer = authority,
        space = 8 + Strategy::SIZE,
    )]
    pub strategy: Account<'info, Strategy>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(strategy_key: [u8; 32])]
pub struct ExecuteStrategy<'info> {
    #[account(
        seeds = [b"registry", registry.authority.as_ref()],
        bump = registry.bump,
    )]
    pub registry: Account<'info, Registry>,
    #[account(
        seeds = [b"strategy", registry.key().as_ref(), &strategy_key],
        bump = strategy.bump,
        constraint = strategy.registry == registry.key() @ ErrorCode::RegistryMismatch,
    )]
    pub strategy: Account<'info, Strategy>,
    pub user: Signer<'info>,
}

// State
#[account]
pub struct Registry {
    pub authority: Pubkey,
    pub bump: u8,
}

impl Registry { const SIZE: usize = 32 + 1; }

#[account]
pub struct Strategy {
    pub registry: Pubkey,
    pub strategy_key: [u8; 32],
    pub target_program: Pubkey,
    pub bump: u8,
}

impl Strategy { const SIZE: usize = 32 + 32 + 32 + 1; }

// Events
#[event]
pub struct StrategyExecutionRequested {
    pub user: Pubkey,
    pub strategy: [u8; 32],
    pub target_program: Pubkey,
    pub ts: i64,
}

// Errors
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")] Unauthorized,
    #[msg("Not approved")] NotApproved,
    #[msg("Strategy key mismatch")] StrategyKeyMismatch,
    #[msg("Registry mismatch")] RegistryMismatch,
    #[msg("Market not active")] MarketNotActive,
}

// ====== Distributional Markets: Params, Accounts, Contexts, Events ======

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MarketParams {
    pub slug: [u8; 32],
    pub outcome_min: f64,
    pub outcome_max: f64,
    pub unit: [u8; 12],
    pub dist_type: u8,
    pub mu: f64,
    pub sigma: f64,
    pub sigma_min: f64,
    pub step: f64,
    pub resolution_time: i64,
    pub oracle_config: [u8; 64],
    pub fee_bps_platform: u16,
    pub fee_bps_creator: u16,
}

#[account]
pub struct Market {
    pub authority: Pubkey,
    pub slug: [u8; 32],
    pub market_type: u8,
    pub outcome_min: f64,
    pub outcome_max: f64,
    pub unit: [u8; 12],
    pub dist_type: u8,
    pub mu: f64,
    pub sigma: f64,
    pub sigma_min: f64,
    pub step: f64,
    pub resolution_time: i64,
    pub oracle_config: [u8; 64],
    pub fee_bps_platform: u16,
    pub fee_bps_creator: u16,
    pub liquidity_pool: Pubkey,
    pub order_book: Pubkey,
    pub collateral_vault: Pubkey,
    pub status: u8,
    pub bump: u8,
}

impl Market {
    pub const SIZE: usize = 32 + 32 + 1 + 8 + 8 + 12 + 1 + 8 + 8 + 8 + 8 + 8 + 64 + 2 + 2 + 32 + 32 + 32 + 1 + 1;
}

#[account]
pub struct LiquidityPool {
    pub market: Pubkey,
    pub vault: Pubkey,
    pub total_liquidity: u64,
    pub bump: u8,
}

impl LiquidityPool { pub const SIZE: usize = 32 + 32 + 8 + 1; }

#[account]
pub struct OrderBook {
    pub market: Pubkey,
    pub best_bid: f64,
    pub best_ask: f64,
    pub event_counter: u64,
    pub bump: u8,
}

impl OrderBook { pub const SIZE: usize = 32 + 8 + 8 + 8 + 1; }

#[account]
pub struct CollateralVault {
    pub market: Pubkey,
    pub bump: u8,
}

impl CollateralVault { pub const SIZE: usize = 32 + 1; }

#[account]
pub struct PmAmmPool {
    pub market: Pubkey,
    pub x: u64,
    pub y: u64,
    pub l0: u64,
    pub dynamic_on: u8,
    pub fee_bps: u16,
    pub expiry_ts: i64,
    pub bump: u8,
}

impl PmAmmPool { pub const SIZE: usize = 68; }

#[account]
pub struct UserProfile {
    pub owner: Pubkey,
    pub open_positions: u32,
    pub bump: u8,
}

impl UserProfile { pub const SIZE: usize = 32 + 4 + 1; }

#[account]
pub struct Position {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub size: u64,
    pub collateral_locked: u64,
    pub entry_ts: i64,
    pub realized_pnl: i64,
    pub bump: u8,
}

impl Position { pub const SIZE: usize = 32 + 32 + 8 + 8 + 8 + 8 + 1; }

#[account]
pub struct PendingOrder {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub side: u8,
    pub price_bps: u64,
    pub size: u64,
    pub ts: i64,
    pub bump: u8,
}

impl PendingOrder { pub const SIZE: usize = 32 + 32 + 1 + 8 + 8 + 8 + 1; }

// Contexts

#[derive(Accounts)]
#[instruction(params: MarketParams)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        seeds = [b"market", authority.key().as_ref(), &params.slug],
        bump,
        payer = authority,
        space = 8 + Market::SIZE,
    )]
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeMarketInfrastructure<'info> {
    #[account(
        mut,
        seeds = [b"market", authority.key().as_ref(), &market.slug],
        bump = market.bump,
        has_one = authority,
    )]
    pub market: Account<'info, Market>,
    #[account(
        init,
        seeds = [b"pool", market.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + LiquidityPool::SIZE,
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,
    #[account(
        init,
        seeds = [b"orderbook", market.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + OrderBook::SIZE,
    )]
    pub order_book: Account<'info, OrderBook>,
    #[account(
        init,
        seeds = [b"collateral", market.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + CollateralVault::SIZE,
    )]
    pub collateral_vault: Account<'info, CollateralVault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceLimitOrder<'info> {
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub order_book: Account<'info, OrderBook>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteMarketOrder<'info> {
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub order_book: Account<'info, OrderBook>,
    #[account(mut)]
    pub liquidity_pool: Account<'info, LiquidityPool>,
    pub taker: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub order_book: Account<'info, OrderBook>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub position: Account<'info, Position>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitUser<'info> {
    #[account(
        init,
        seeds = [b"user", owner.key().as_ref()],
        bump,
        payer = owner,
        space = 8 + UserProfile::SIZE,
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct OpenPosition<'info> {
    pub market: Account<'info, Market>,
    #[account(
        init,
        seeds = [b"position", owner.key().as_ref(), market.key().as_ref()],
        bump,
        payer = owner,
        space = 8 + Position::SIZE,
    )]
    pub position: Account<'info, Position>,
    #[account(
        mut,
        seeds = [b"user", owner.key().as_ref()],
        bump = user_profile.bump,
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdjustPosition<'info> {
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref(), market.key().as_ref()],
        bump = position.bump,
    )]
    pub position: Account<'info, Position>,
    #[account(
        seeds = [b"user", owner.key().as_ref()],
        bump = user_profile.bump,
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClosePosition<'info> {
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref(), market.key().as_ref()],
        bump = position.bump,
    )]
    pub position: Account<'info, Position>,
    #[account(
        mut,
        seeds = [b"user", owner.key().as_ref()],
        bump = user_profile.bump,
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [b"pool", market.key().as_ref()],
        bump = liquidity_pool.bump,
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,
    pub provider: Signer<'info>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [b"pool", market.key().as_ref()],
        bump = liquidity_pool.bump,
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,
    pub provider: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitPmAmm<'info> {
    #[account(mut, has_one = authority)]
    pub market: Account<'info, Market>,
    #[account(
        init,
        seeds = [b"pmamm", market.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + PmAmmPool::SIZE,
    )]
    pub pmamm_pool: Account<'info, PmAmmPool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TradePmAmm<'info> {
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [b"pmamm", market.key().as_ref()],
        bump = pmamm_pool.bump,
    )]
    pub pmamm_pool: Account<'info, PmAmmPool>,
    pub taker: Signer<'info>,
}

// Events for front-end subscriptions
#[event]
pub struct MarketCreated {
    pub market: Pubkey,
    pub authority: Pubkey,
    pub slug: [u8; 32],
    pub outcome_min: f64,
    pub outcome_max: f64,
    pub unit: [u8; 12],
    pub ts: i64,
}

#[event]
pub struct MarketInfrastructureInitialized {
    pub market: Pubkey,
    pub ts: i64,
}

#[event]
pub struct PmAmmInitialized {
    pub market: Pubkey,
    pub l0: u64,
    pub dynamic_on: u8,
    pub fee_bps: u16,
    pub expiry_ts: i64,
    pub ts: i64,
}

#[event]
pub struct OrderPlaced {
    pub order_id: u64,
    pub market: Pubkey,
    pub owner: Pubkey,
    pub side: u8,
    pub price_bps: u64,
    pub size: u64,
    pub ts: i64,
}

#[event]
pub struct TradeExecuted {
    pub market: Pubkey,
    pub taker: Pubkey,
    pub side: u8,
    pub price_bps: u64,
    pub size: u64,
    pub ts: i64,
}

#[event]
pub struct OrderCancelled {
    pub order_id: u64,
    pub ts: i64,
}

#[event]
pub struct MarketResolved {
    pub market: Pubkey,
    pub outcome_value: f64,
    pub ts: i64,
}

#[event]
pub struct PayoutClaimed {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub amount: u64,
    pub ts: i64,
}

#[event]
pub struct PositionOpened {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub size: u64,
    pub collateral_locked: u64,
    pub ts: i64,
}

#[event]
pub struct PositionAdjusted {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub delta_size: i64,
    pub delta_collateral: i64,
    pub ts: i64,
}

#[event]
pub struct PositionClosed {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub size: u64,
    pub collateral_locked: u64,
    pub realized_pnl: i64,
    pub ts: i64,
}

#[event]
pub struct LiquidityAdded {
    pub market: Pubkey,
    pub provider: Pubkey,
    pub amount: u64,
    pub ts: i64,
}

#[event]
pub struct LiquidityRemoved {
    pub market: Pubkey,
    pub provider: Pubkey,
    pub amount: u64,
    pub ts: i64,
}
