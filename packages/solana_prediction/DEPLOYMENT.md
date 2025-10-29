# Solana Program Deployment Guide

This guide covers deploying the `solana_prediction` Anchor program to Solana devnet and mainnet.

---

## Prerequisites

1. **Install Solana CLI**
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

2. **Install Anchor CLI**
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   ```

3. **Create/Configure Wallet**
   ```bash
   solana-keygen new --outfile ~/.config/solana/id.json
   # Or use existing wallet
   solana config set --keypair ~/.config/solana/id.json
   ```

4. **Verify Installation**
   ```bash
   solana --version
   anchor --version
   ```

---

## Fix "String is the wrong size" Error

The error occurs when `Anchor.toml` has an empty program ID or `lib.rs` has a placeholder.

**Solution:**
```bash
./scripts/generate-program-id.sh
```

This script:
- Generates a new program keypair at `target/deploy/solana_prediction-keypair.json`
- Extracts the program ID
- Updates `Anchor.toml` `[programs.localnet]` section
- Updates `lib.rs` `declare_id!` macro
- Syncs both files automatically

After running, you can build:
```bash
anchor build
```

---

## Deployment Workflows

### 1. Deploy to Devnet (Testing)

```bash
./scripts/deploy-devnet.sh
```

**What it does:**
- Switches Solana CLI to devnet
- Checks wallet balance (airdrops 2 SOL if needed)
- Builds the program
- Deploys to devnet
- Outputs program ID and explorer link

**Cost:** Free (devnet SOL via airdrop)

**Output example:**
```
✅ Deployment complete!
Program ID: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
Network: Devnet
Explorer: https://explorer.solana.com/address/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?cluster=devnet
```

### 2. Deploy to Mainnet (Production)

```bash
./scripts/deploy-mainnet.sh
```

**What it does:**
- Prompts for confirmation (costs real SOL)
- Switches to mainnet-beta
- Checks wallet balance (requires ~5 SOL)
- Builds and deploys
- Outputs program ID and backup reminder

**Cost:** 2-5 SOL (depending on program size)

**⚠️ Important:**
- Backup `target/deploy/solana_prediction-keypair.json` securely
- This keypair is the program upgrade authority
- Loss of keypair = cannot upgrade program

### 3. Upgrade Existing Program

```bash
# Devnet
./scripts/upgrade-program.sh devnet

# Mainnet
./scripts/upgrade-program.sh mainnet
```

**What it does:**
- Rebuilds the program
- Deploys new bytecode to existing program ID
- Preserves program accounts and state

**Requirements:**
- Original program keypair must exist at `target/deploy/solana_prediction-keypair.json`
- Wallet must be the upgrade authority

### 4. Verify Deployment

```bash
# Devnet
./scripts/verify-deployment.sh devnet

# Mainnet
./scripts/verify-deployment.sh mainnet
```

**What it does:**
- Queries on-chain program metadata
- Confirms program is deployed and accessible
- Shows program size, upgrade authority, etc.

---

## Update Frontend Environment

After deployment, update your web app `.env`:

**Devnet:**
```env
NEXT_PUBLIC_SOLANA_PROGRAM_ID=<your-program-id>
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Mainnet:**
```env
NEXT_PUBLIC_SOLANA_PROGRAM_ID=<your-program-id>
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

---

## CI/CD Integration (GitHub Actions)

Add to `.github/workflows/deploy-solana-program.yml`:

```yaml
name: Deploy Solana Program

on:
  push:
    branches: [main]
    paths:
      - 'packages/solana_prediction/**'
  workflow_dispatch:
    inputs:
      network:
        description: 'Network (devnet or mainnet)'
        required: true
        default: 'devnet'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Solana
        run: |
          sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH
      
      - name: Install Anchor
        run: |
          cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
          avm install latest
          avm use latest
      
      - name: Setup Wallet
        run: |
          echo "${{ secrets.SOLANA_DEPLOYER_KEYPAIR }}" > ~/.config/solana/id.json
          chmod 600 ~/.config/solana/id.json
      
      - name: Restore Program Keypair
        run: |
          mkdir -p packages/solana_prediction/target/deploy
          echo "${{ secrets.SOLANA_PROGRAM_KEYPAIR }}" > packages/solana_prediction/target/deploy/solana_prediction-keypair.json
      
      - name: Deploy
        working-directory: packages/solana_prediction
        run: |
          if [ "${{ github.event.inputs.network }}" == "mainnet" ]; then
            ./scripts/deploy-mainnet.sh
          else
            ./scripts/deploy-devnet.sh
          fi
      
      - name: Update Frontend Env
        run: |
          PROGRAM_ID=$(solana-keygen pubkey packages/solana_prediction/target/deploy/solana_prediction-keypair.json)
          echo "NEXT_PUBLIC_SOLANA_PROGRAM_ID=$PROGRAM_ID" >> $GITHUB_ENV
```

**Required Secrets:**
- `SOLANA_DEPLOYER_KEYPAIR`: Your wallet keypair JSON (base64 encoded)
- `SOLANA_PROGRAM_KEYPAIR`: Program keypair JSON (base64 encoded)

---

## Troubleshooting

### "String is the wrong size"
- Run `./scripts/generate-program-id.sh`
- Ensure `Anchor.toml` and `lib.rs` have matching valid program IDs

### "Insufficient funds"
- **Devnet:** Run `solana airdrop 2`
- **Mainnet:** Transfer SOL to your wallet

### "Program already exists"
- Use `./scripts/upgrade-program.sh` instead of deploy

### Build errors
```bash
anchor clean
anchor build
```

### Check wallet balance
```bash
solana balance
```

### Check current network
```bash
solana config get
```

---

## Security Best Practices

1. **Keypair Management**
   - Never commit keypairs to git (already in `.gitignore`)
   - Use hardware wallets for mainnet deployments
   - Store backups encrypted in secure locations

2. **Upgrade Authority**
   - Consider multisig for mainnet upgrade authority
   - Use `solana program set-upgrade-authority` to transfer

3. **Testing**
   - Always deploy to devnet first
   - Run integration tests before mainnet
   - Use `anchor test` for unit tests

4. **Monitoring**
   - Monitor program logs via Solana Explorer
   - Set up alerts for failed transactions
   - Track program account rent status

---

## Cost Estimates

- **Devnet:** Free (airdrop)
- **Mainnet Initial Deploy:** 2-5 SOL (depends on program size)
- **Mainnet Upgrade:** 0.5-2 SOL (smaller diff = cheaper)
- **Account Rent:** Minimal (programs are rent-exempt)

---

## Next Steps

1. Deploy to devnet: `./scripts/deploy-devnet.sh`
2. Test with frontend on devnet
3. Run integration tests
4. Deploy to mainnet: `./scripts/deploy-mainnet.sh`
5. Update production frontend env vars
6. Monitor via Solana Explorer
