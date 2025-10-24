#!/usr/bin/env bash
set -e

echo "🚀 Deploying solana_prediction to Mainnet-Beta..."
echo "⚠️  WARNING: This will deploy to MAINNET and cost real SOL."
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Deployment cancelled."
  exit 0
fi

# Switch to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Check wallet balance
BALANCE=$(solana balance)
echo "Wallet balance: $BALANCE"

# Ensure sufficient balance (deployment typically costs 2-5 SOL depending on program size)
echo "Ensure you have at least 5 SOL for deployment costs."
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Build the program
echo "Building program..."
anchor build

# Verify program size
PROGRAM_SIZE=$(wc -c < target/deploy/solana_prediction.so)
echo "Program size: $PROGRAM_SIZE bytes"

# Deploy to mainnet
echo "Deploying to mainnet-beta..."
anchor deploy --provider.cluster mainnet

# Get the deployed program ID
PROGRAM_ID=$(solana-keygen pubkey target/deploy/solana_prediction-keypair.json)
echo ""
echo "✅ Deployment complete!"
echo "Program ID: $PROGRAM_ID"
echo "Network: Mainnet-Beta"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID"
echo ""
echo "Update your frontend .env with:"
echo "NEXT_PUBLIC_SOLANA_PROGRAM_ID=$PROGRAM_ID"
echo "NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta"
echo ""
echo "🔒 IMPORTANT: Backup your keypair at target/deploy/solana_prediction-keypair.json"
echo "Store it securely - it's needed for program upgrades."
