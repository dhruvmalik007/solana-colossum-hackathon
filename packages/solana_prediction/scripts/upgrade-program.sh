#!/usr/bin/env bash
set -e

# Upgrade an existing program deployment
# Usage: ./upgrade-program.sh [devnet|mainnet]

NETWORK=${1:-devnet}

if [ "$NETWORK" == "mainnet" ]; then
  CLUSTER="mainnet"
  RPC_URL="https://api.mainnet-beta.solana.com"
  echo "⚠️  Upgrading on MAINNET"
else
  CLUSTER="devnet"
  RPC_URL="https://api.devnet.solana.com"
  echo "Upgrading on Devnet"
fi

solana config set --url "$RPC_URL"

# Build the program
echo "Building program..."
anchor build

# Get program ID
PROGRAM_ID=$(solana-keygen pubkey target/deploy/solana_prediction-keypair.json)
echo "Program ID: $PROGRAM_ID"

# Upgrade the program
echo "Upgrading program on $CLUSTER..."
solana program deploy \
  --program-id target/deploy/solana_prediction-keypair.json \
  target/deploy/solana_prediction.so \
  --url "$RPC_URL"

echo ""
echo "✅ Program upgraded successfully!"
echo "Program ID: $PROGRAM_ID"
echo "Network: $CLUSTER"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID$([ "$CLUSTER" == "devnet" ] && echo "?cluster=devnet" || echo "")"
