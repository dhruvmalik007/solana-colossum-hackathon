# solana_prediction (Anchor program)

Distributional prediction markets on Solana with hybrid CLOB/AMM routing.

- **Program path:** `packages/solana_prediction/programs/solana_prediction`
- **Features:** Market creation, position management, liquidity pools, order routing
- **Design:** See `development-specs/markets-design/DISTRIBUTIONAL_MARKETS_PROGRAM_DESIGN.md`

---

## Quick Start

### Fix "String is the wrong size" Error

If you see this error when running `anchor build`, it means the program ID needs to be generated:

```bash
./scripts/setup-and-build.sh
```

This will:
- Check for Solana/Anchor CLI
- Generate program keypair if missing
- Sync program ID to `Anchor.toml` and `lib.rs`
- Build the program

### Manual Build

```bash
# Ensure Anchor 0.29.x installed
anchor --version

# Build
cd packages/solana_prediction
anchor build
```

---

## Deployment

### Devnet (Testing)

```bash
./scripts/deploy-devnet.sh
```

- Free (uses airdrop)
- Outputs program ID and explorer link
- Updates can be done via `./scripts/upgrade-program.sh devnet`

### Mainnet (Production)

```bash
./scripts/deploy-mainnet.sh
```

- Costs 2-5 SOL
- Prompts for confirmation
- **Backup keypair:** `target/deploy/solana_prediction-keypair.json`

### Verify Deployment

```bash
./scripts/verify-deployment.sh devnet
# or
./scripts/verify-deployment.sh mainnet
```

---

## Local Development

```bash
# Start local validator
solana-test-validator -r

# Deploy to localnet
anchor deploy
```

## Registry (off-chain metadata)

Off-chain list for Solana DeFi protocols (program addresses, optional IDL URLs) is kept under `registry/`.

- Schema: `registry/protocols.schema.json`
- Example: `registry/protocols.sample.json`

Integrations can parse this list to compute strategy keys and feed `upsert_strategy` on-chain.
