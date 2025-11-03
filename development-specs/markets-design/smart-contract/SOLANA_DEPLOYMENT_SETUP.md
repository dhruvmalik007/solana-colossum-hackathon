# Solana Program Deployment Setup

Complete guide for deploying the `solana_prediction` Anchor program to devnet and mainnet.

---

## Problem Solved

**Error:** `anchor build` fails with `Error: String is the wrong size`

**Root Cause:** Empty or invalid program ID in `Anchor.toml` and `lib.rs`

**Solution:** Automated scripts to generate, sync, and deploy program IDs

---

## Quick Fix (One Command)

```bash
cd packages/solana_prediction
./scripts/setup-and-build.sh
```

This checks dependencies, generates keypair, syncs IDs, and builds.

---

## Scripts Created

### 1. `scripts/generate-program-id.sh`
- Generates program keypair if missing
- Extracts program ID
- Updates `Anchor.toml` (localnet, devnet, mainnet)
- Updates `lib.rs` `declare_id!` macro
- **Usage:** `./scripts/generate-program-id.sh`

### 2. `scripts/deploy-devnet.sh`
- Switches to devnet
- Requests airdrop if needed
- Builds and deploys program
- Outputs program ID and explorer link
- **Usage:** `./scripts/deploy-devnet.sh`
- **Cost:** Free (airdrop)

### 3. `scripts/deploy-mainnet.sh`
- Prompts for confirmation (costs real SOL)
- Switches to mainnet-beta
- Checks balance (requires ~5 SOL)
- Builds and deploys
- Outputs backup reminder
- **Usage:** `./scripts/deploy-mainnet.sh`
- **Cost:** 2-5 SOL

### 4. `scripts/upgrade-program.sh`
- Upgrades existing deployment
- Preserves program ID and accounts
- **Usage:** `./scripts/upgrade-program.sh [devnet|mainnet]`

### 5. `scripts/verify-deployment.sh`
- Queries on-chain program metadata
- Confirms deployment success
- **Usage:** `./scripts/verify-deployment.sh [devnet|mainnet]`

### 6. `scripts/setup-and-build.sh`
- All-in-one setup and build
- Checks CLI installations
- Generates keypair if needed
- Builds program
- **Usage:** `./scripts/setup-and-build.sh`

---

## GitHub Actions Workflow

**File:** `.github/workflows/deploy-solana-program.yml`

**Triggers:**
- Push to `main`, `staging`, `dev` (auto-deploys to devnet)
- Manual dispatch with network choice (devnet/mainnet)

**Features:**
- Installs Solana/Anchor CLI
- Restores program keypair from secrets
- Builds and deploys
- Triggers frontend redeployment via `repository_dispatch`
- Outputs deployment summary

**Required Secrets:**
- `SOLANA_DEPLOYER_KEYPAIR`: Wallet keypair (base64 encoded)
- `SOLANA_PROGRAM_KEYPAIR`: Program keypair (base64 encoded)

**To encode keypairs:**
```bash
cat ~/.config/solana/id.json | base64
cat target/deploy/solana_prediction-keypair.json | base64
```

---

## Documentation Files

1. **`QUICK_FIX.md`** - One-page error fix guide
2. **`DEPLOYMENT.md`** - Complete deployment manual with:
   - Prerequisites
   - Step-by-step workflows
   - CI/CD setup
   - Troubleshooting
   - Security best practices
   - Cost estimates

3. **`README.md`** - Updated with quick-start and deployment links

4. **`.gitignore`** - Ensures keypairs never committed

---

## Workflow Examples

### First-Time Setup

```bash
cd packages/solana_prediction

# 1. Setup and build
./scripts/setup-and-build.sh

# 2. Deploy to devnet
./scripts/deploy-devnet.sh

# 3. Verify
./scripts/verify-deployment.sh devnet

# 4. Update frontend .env
# NEXT_PUBLIC_SOLANA_PROGRAM_ID=<program-id>
# NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

### Upgrade Existing Program

```bash
# Make code changes
# ...

# Rebuild and upgrade
./scripts/upgrade-program.sh devnet

# Or mainnet
./scripts/upgrade-program.sh mainnet
```

### Production Deployment

```bash
# 1. Test on devnet first
./scripts/deploy-devnet.sh

# 2. Run integration tests
# ...

# 3. Deploy to mainnet
./scripts/deploy-mainnet.sh

# 4. Backup keypair
cp target/deploy/solana_prediction-keypair.json ~/secure-backup/

# 5. Update production .env
# NEXT_PUBLIC_SOLANA_PROGRAM_ID=<program-id>
# NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

---

## Integration with Frontend

After deployment, the workflow triggers `repository_dispatch` event:

```yaml
event-type: solana-program-deployed
client-payload:
  program_id: "<deployed-program-id>"
  network: "devnet|mainnet"
  environment: "dev|staging|prod"
  explorer_url: "https://explorer.solana.com/..."
```

The frontend deployment workflow (`.github/workflows/deploy-amplify-frontend.yml`) listens for this event and:
- Updates `NEXT_PUBLIC_SOLANA_PROGRAM_ID` env var in Amplify
- Triggers new frontend build
- Links to program in deployment summary

---

## Security Notes

1. **Keypairs are gitignored** - Never commit to repo
2. **GitHub Secrets** - Store base64-encoded keypairs
3. **Upgrade Authority** - Program keypair controls upgrades
4. **Mainnet Backups** - Always backup `*-keypair.json` files
5. **Multisig** - Consider for production upgrade authority

---

## Troubleshooting

### "String is the wrong size"
```bash
./scripts/generate-program-id.sh
anchor build
```

### "Insufficient funds"
```bash
# Devnet
solana airdrop 2

# Mainnet
# Transfer SOL to wallet
```

### "Program already exists"
```bash
# Use upgrade instead
./scripts/upgrade-program.sh devnet
```

### Check current config
```bash
solana config get
solana balance
```

---

## Cost Summary

| Action | Devnet | Mainnet |
|--------|--------|---------|
| Initial Deploy | Free (airdrop) | 2-5 SOL |
| Upgrade | Free | 0.5-2 SOL |
| Account Rent | Free (rent-exempt) | Minimal |

---

## Next Steps

1. ✅ Fix build error: `./scripts/setup-and-build.sh`
2. ✅ Deploy to devnet: `./scripts/deploy-devnet.sh`
3. ⏳ Test with frontend on devnet
4. ⏳ Run integration tests
5. ⏳ Deploy to mainnet: `./scripts/deploy-mainnet.sh`
6. ⏳ Update production env vars
7. ⏳ Monitor via Solana Explorer

---

## Files Modified/Created

**Scripts:**
- `packages/solana_prediction/scripts/generate-program-id.sh`
- `packages/solana_prediction/scripts/deploy-devnet.sh`
- `packages/solana_prediction/scripts/deploy-mainnet.sh`
- `packages/solana_prediction/scripts/upgrade-program.sh`
- `packages/solana_prediction/scripts/verify-deployment.sh`
- `packages/solana_prediction/scripts/setup-and-build.sh`

**Docs:**
- `packages/solana_prediction/QUICK_FIX.md`
- `packages/solana_prediction/DEPLOYMENT.md`
- `packages/solana_prediction/README.md` (updated)
- `development-specs/SOLANA_DEPLOYMENT_SETUP.md` (this file)

**Config:**
- `packages/solana_prediction/Anchor.toml` (added devnet/mainnet sections)
- `packages/solana_prediction/.gitignore` (created)

**CI/CD:**
- `.github/workflows/deploy-solana-program.yml`

**All scripts are executable** (`chmod +x`)
