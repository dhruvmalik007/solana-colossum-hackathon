#!/usr/bin/env bash
set -e

# Verify a deployed program
# Usage: ./verify-deployment.sh [devnet|mainnet]

NETWORK=${1:-devnet}

if [ "$NETWORK" == "mainnet" ]; then
  RPC_URL="https://api.mainnet-beta.solana.com"
  CLUSTER_PARAM=""
else
  RPC_URL="https://api.devnet.solana.com"
  CLUSTER_PARAM="?cluster=devnet"
fi

PROGRAM_ID=$(solana-keygen pubkey target/deploy/solana_prediction-keypair.json)

echo "Verifying program deployment..."
echo "Program ID: $PROGRAM_ID"
echo "Network: $NETWORK"
echo ""

# Check if program exists
solana program show "$PROGRAM_ID" --url "$RPC_URL"

echo ""
echo "✅ Program is deployed and accessible"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID$CLUSTER_PARAM"
