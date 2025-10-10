use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke_signed};
pub mod math;

// TODO: Replace with your deployed program ID later
declare_id!("So1PrediCt1onWrapPer111111111111111111111111111");

#[program]
pub mod solana_prediction {
    use super::*;

    // Initialize a registry controlled by an authority
    pub fn init_registry(ctx: Context<InitRegistry>) -> Result<()> {
        let reg = &mut ctx.accounts.registry;
        reg.authority = ctx.accounts.authority.key();
        reg.bump = *ctx.bumps.get("registry").ok_or(ErrorCode::BumpNotFound)?;
        Ok(())
    }

    // Add (or update) a strategy mapping: key -> target program id
    pub fn upsert_strategy(ctx: Context<UpsertStrategy>, strategy_key: [u8; 32], target_program: Pubkey) -> Result<()> {
        require_keys_eq!(ctx.accounts.registry.authority, ctx.accounts.authority.key(), ErrorCode::Unauthorized);
        let strat = &mut ctx.accounts.strategy;
        strat.registry = ctx.accounts.registry.key();
        strat.strategy_key = strategy_key;
        strat.target_program = target_program;
        strat.bump = *ctx.bumps.get("strategy").ok_or(ErrorCode::BumpNotFound)?;
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
        require_keys_eq!(strat.strategy_key, strategy_key, ErrorCode::StrategyKeyMismatch);
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

    pub fn create_distributional_market(
        ctx: Context<CreateDistributionalMarket>,
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
        market.liquidity_pool = ctx.accounts.liquidity_pool.key();
        market.order_book = ctx.accounts.order_book.key();
        market.collateral_vault = ctx.accounts.collateral_vault.key();
        market.status = 0;
        market.bump = *ctx.bumps.get("market").ok_or(ErrorCode::BumpNotFound)?;

        let lp = &mut ctx.accounts.liquidity_pool;
        lp.market = market.key();
        lp.vault = ctx.accounts.collateral_vault.key();
        lp.total_liquidity = 0;
        lp.bump = *ctx.bumps.get("liquidity_pool").ok_or(ErrorCode::BumpNotFound)?;

        let ob = &mut ctx.accounts.order_book;
        ob.market = market.key();
        ob.best_bid = 0.0;
        ob.best_ask = 0.0;
        ob.event_counter = 0;
        ob.bump = *ctx.bumps.get("order_book").ok_or(ErrorCode::BumpNotFound)?;

        let cv = &mut ctx.accounts.collateral_vault;
        cv.market = market.key();
        cv.bump = *ctx.bumps.get("collateral_vault").ok_or(ErrorCode::BumpNotFound)?;

        emit!(MarketCreated {
            market: market.key(),
            authority: market.authority,
            slug: market.slug,
            outcome_min: market.outcome_min,
            outcome_max: market.outcome_max,
            unit: market.unit,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn place_limit_order(
        _ctx: Context<PlaceLimitOrder>,
        _side: u8,
        _price_bps: u64,
        _size: u64,
        _expiry: i64,
    ) -> Result<()> {
        // Scaffold: matching engine to be implemented per HYBRID_ORDER_BOOK.md
        // Emit event stub so front-end can subscribe while on-chain logic is WIP
        emit!(OrderPlaced { order_id: 0, market: Pubkey::default(), owner: Pubkey::default(), side: _side, price_bps: _price_bps, size: _size, ts: Clock::get()?.unix_timestamp });
        Ok(())
    }

    pub fn execute_market_order(
        _ctx: Context<ExecuteMarketOrder>,
        _side: u8,
        _size: u64,
    ) -> Result<()> {
        // Scaffold: route CLOB then AMM fallback; update consensus distribution
        emit!(TradeExecuted { market: Pubkey::default(), taker: Pubkey::default(), side: _side, price_bps: 0, size: _size, ts: Clock::get()?.unix_timestamp });
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
        let market = &mut ctx.accounts.market;
        market.status = 2; // resolved
        emit!(MarketResolved { market: market.key(), outcome_value, ts: Clock::get()?.unix_timestamp });
        Ok(())
    }

    pub fn claim_payout(_ctx: Context<ClaimPayout>) -> Result<()> {
        emit!(PayoutClaimed { owner: Pubkey::default(), market: Pubkey::default(), amount: 0, ts: Clock::get()?.unix_timestamp });
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
    #[msg("Bump not found")] BumpNotFound,
    #[msg("Unauthorized")] Unauthorized,
    #[msg("Not approved")] NotApproved,
    #[msg("Strategy key mismatch")] StrategyKeyMismatch,
    #[msg("Registry mismatch")] RegistryMismatch,
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
pub struct CreateDistributionalMarket<'info> {
    #[account(
        init,
        seeds = [b"market", authority.key().as_ref(), &params.slug],
        bump,
        payer = authority,
        space = 8 + Market::SIZE,
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
