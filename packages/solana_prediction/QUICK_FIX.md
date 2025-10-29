# Quick Fix: "String is the wrong size" Error

## Problem

When running `anchor build`, you see:
```
Error: String is the wrong size
```

## Root Cause

- `Anchor.toml` has empty program ID: `solana_prediction = ""`
- `lib.rs` has placeholder: `declare_id!("So1PrediCt1onWrapPer111111111111111111111111111");`
- Anchor cannot parse these as valid Solana public keys (must be 32-byte base58)

## Solution (One Command)

```bash
./scripts/setup-and-build.sh
```

This automated script:
1. Checks if Solana/Anchor CLI are installed
2. Generates a new program keypair (if missing)
3. Extracts the program ID
4. Updates `Anchor.toml` for all networks (localnet, devnet, mainnet)
5. Updates `lib.rs` `declare_id!` macro
6. Runs `anchor build`

## Manual Fix (If Preferred)

```bash
# 1. Generate keypair
mkdir -p target/deploy
solana-keygen new --no-bip39-passphrase -o target/deploy/solana_prediction-keypair.json --force

# 2. Get program ID
PROGRAM_ID=$(solana-keygen pubkey target/deploy/solana_prediction-keypair.json)
echo "Program ID: $PROGRAM_ID"

# 3. Update Anchor.toml (replace empty strings with $PROGRAM_ID)
# Edit manually or use sed

# 4. Update lib.rs
# Replace declare_id!("...") with declare_id!("$PROGRAM_ID")

# 5. Build
anchor build
```

## After Build Success

Deploy to devnet:
```bash
./scripts/deploy-devnet.sh
```

Or mainnet:
```bash
./scripts/deploy-mainnet.sh
```

## Prerequisites

If you don't have Solana/Anchor CLI:

**Solana CLI:**
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

**Anchor CLI:**
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0
```

## Verify Installation

```bash
solana --version
anchor --version
```

Expected output:
```
solana-cli 1.18.x
anchor-cli 0.29.0
```

## Next Steps

1. Run `./scripts/setup-and-build.sh`
2. Deploy to devnet: `./scripts/deploy-devnet.sh`
3. Update frontend `.env`:
   ```
   NEXT_PUBLIC_SOLANA_PROGRAM_ID=<your-program-id>
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   ```
4. Test integration
5. Deploy to mainnet when ready

## Full Documentation

See `DEPLOYMENT.md` for complete deployment guide, CI/CD setup, and troubleshooting.
