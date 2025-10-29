#!/usr/bin/env bash
set -e

echo "🚀 Deploying solana_prediction to Devnet..."

# Switch to devnet
solana config set --url https://api.devnet.solana.com

# Check wallet balance
BALANCE=$(solana balance)
echo "Wallet balance: $BALANCE"

# Airdrop if balance is low (devnet only)
if [[ "$BALANCE" == "0 SOL" ]]; then
  echo "Requesting airdrop..."
  solana airdrop 2
  sleep 5
fi

# Build the program
echo "Building program..."
anchor build

# Deploy to devnet
echo "Deploying to devnet..."
anchor deploy --provider.cluster devnet

# Get the deployed program ID
PROGRAM_ID=$(solana-keygen pubkey target/deploy/solana_prediction-keypair.json)
echo ""
echo "✅ Deployment complete!"
echo "Program ID: $PROGRAM_ID"
echo "Network: Devnet"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "Update your frontend .env with:"
echo "NEXT_PUBLIC_SOLANA_PROGRAM_ID=$PROGRAM_ID"
echo "NEXT_PUBLIC_SOLANA_NETWORK=devnet"
