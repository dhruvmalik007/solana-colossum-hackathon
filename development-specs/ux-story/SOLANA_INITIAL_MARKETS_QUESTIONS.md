# Initial Solana Distribution Markets — Questions & Selections

This file enumerates the first wave of continuous-outcome markets we will seed, mapped to DeFiLlama metrics and protocol pages.

## Chain-Level Markets

- Solana TVL (EOM)
  - Question: What will Solana chain TVL be at end of {YYYY-MM}?
  - Range: $5B–$60B; Bin: $250M; Prior: N(30d MA, 10% of MA)
  - Source: DefiLlama /chain/solana (TVL)

- DEX Volume (24h)
  - Question: What will Solana DEX 24h volume be on {YYYY-MM-DD}?
  - Range: $0.2B–$10B; Bin: $50M; Prior: N(7d mean, 1.25×std)
  - Source: DefiLlama DEX volume (Solana)

- Chain Fees (24h)
  - Question: What will Solana chain fees (USD) be on {YYYY-MM-DD}?
  - Range: $0.1M–$10M; Bin: $50k; Prior: log-normal(30d)
  - Source: DefiLlama chain fees

- Active Addresses (24h)
  - Question: How many active addresses will Solana have on {YYYY-MM-DD}?
  - Range: 0.2M–10M; Bin: 25k; Prior: N(30d MA, std)
  - Source: DefiLlama active addresses

- Transactions (24h)
  - Question: How many transactions will Solana process on {YYYY-MM-DD}?
  - Range: 10M–200M; Bin: 1M; Prior: N(30d MA, std)
  - Source: DefiLlama transactions

- Stablecoins Mcap (EOM)
  - Question: What will Solana stablecoins market cap be at end of {YYYY-MM}?
  - Range: $5B–$40B; Bin: $100M; Prior: N(30d MA, 8% MA)
  - Source: DefiLlama stablecoins on Solana

## Protocol-Level Markets

- Jupiter 24h Volume (DATE)
  - Range: $0.5B–$10B; Bin: $50M; Prior: around 7d median
  - Source: DefiLlama protocol `jupiter`

- Raydium TVL (DATE)
  - Range: $100M–$2B; Bin: $10M; Prior: around 30d median
  - Source: DefiLlama protocol `raydium`

- Orca TVL (DATE)
  - Range: $100M–$2B; Bin: $10M; Prior: around 30d median
  - Source: DefiLlama protocol `orca`

- Jito Stake TVL (DATE)
  - Range: $3B–$20B; Bin: $250M
  - Source: DefiLlama protocol `jito`

- Kamino TVL (DATE)
  - Range: $300M–$5B; Bin: $25M
  - Source: DefiLlama protocol `kamino`

- Marinade Stake TVL (DATE)
  - Range: $2B–$20B; Bin: $250M
  - Source: DefiLlama protocol `marinade`

## Seeding Plan

- Use `POST /api/markets/seed` for chain-level EOM TVL starters
- Add a `POST /api/markets/seed/protocols` (follow-up) to create protocol questions from current values
- Persist prior parameters (μ,σ) and range/bin in market record

## Resolution

- Primary: DefiLlama value at resolution timestamp
- Secondary: official dashboards (record link + hash)
- Dispute window: 24–72h; admin pushes finalization after window closes
