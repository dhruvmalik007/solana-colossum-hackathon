use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke_signed};

// NOTE: Replace with your deployed program ID later
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
