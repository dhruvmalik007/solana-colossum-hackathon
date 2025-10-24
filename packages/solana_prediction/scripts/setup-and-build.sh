#!/usr/bin/env bash
set -e

echo "🔧 Solana Prediction Program Setup"
echo ""

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
  echo "❌ Solana CLI not found"
  echo ""
  echo "Install Solana CLI:"
  echo "  sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
  echo ""
  echo "Then add to PATH:"
  echo "  export PATH=\"\$HOME/.local/share/solana/install/active_release/bin:\$PATH\""
  echo ""
  exit 1
fi

# Check if Anchor CLI is installed
if ! command -v anchor &> /dev/null; then
  echo "❌ Anchor CLI not found"
  echo ""
  echo "Install Anchor CLI:"
  echo "  cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
  echo "  avm install 0.29.0"
  echo "  avm use 0.29.0"
  echo ""
  exit 1
fi

echo "✅ Solana CLI: $(solana --version)"
echo "✅ Anchor CLI: $(anchor --version)"
echo ""

# Check if program keypair exists
if [ ! -f "target/deploy/solana_prediction-keypair.json" ]; then
  echo "⚠️  Program keypair not found"
  echo "Generating new program ID..."
  ./scripts/generate-program-id.sh
else
  PROGRAM_ID=$(solana-keygen pubkey target/deploy/solana_prediction-keypair.json)
  echo "✅ Program keypair exists"
  echo "   Program ID: $PROGRAM_ID"
fi

echo ""
echo "Building program..."
anchor build

echo ""
echo "✅ Build successful!"
echo ""
echo "Next steps:"
echo "  - Deploy to devnet: ./scripts/deploy-devnet.sh"
echo "  - Deploy to mainnet: ./scripts/deploy-mainnet.sh"
echo "  - Verify deployment: ./scripts/verify-deployment.sh [devnet|mainnet]"
