# solana_prediction (Anchor program)

A minimal, safe wrapper that aggregates strategies and gates CPI execution behind an approval condition.

- Program path: `packages/solana_prediction/programs/solana_prediction`
- Registry PDAs: `Registry` (per-authority) and `Strategy` (per strategy key)
- Instructions:
  - `init_registry(authority)`
  - `upsert_strategy(strategy_key, target_program)`
  - `execute_strategy(strategy_key, approved, ix_data)` — emits an event only (no CPI in the starter for safety)

## Build locally

```bash
anchor --version
# ensure Anchor 0.29.x installed

cd packages/solana_prediction
anchor build
```

## Deploy (localnet)

```bash
solana-test-validator -r
anchor deploy
```

## Registry (off-chain metadata)

Off-chain list for Solana DeFi protocols (program addresses, optional IDL URLs) is kept under `registry/`.

- Schema: `registry/protocols.schema.json`
- Example: `registry/protocols.sample.json`

Integrations can parse this list to compute strategy keys and feed `upsert_strategy` on-chain.
