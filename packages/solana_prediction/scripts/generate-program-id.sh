#!/usr/bin/env bash
set -e

# Generate program keypair if it doesn't exist
KEYPAIR_PATH="target/deploy/solana_prediction-keypair.json"

if [ ! -f "$KEYPAIR_PATH" ]; then
  echo "Generating new program keypair at $KEYPAIR_PATH..."
  mkdir -p target/deploy
  solana-keygen new --no-bip39-passphrase -o "$KEYPAIR_PATH" --force
else
  echo "Program keypair already exists at $KEYPAIR_PATH"
fi

# Extract the program ID
PROGRAM_ID=$(solana-keygen pubkey "$KEYPAIR_PATH")
echo "Program ID: $PROGRAM_ID"

# Update Anchor.toml with the program ID (all networks)
echo "Updating Anchor.toml..."
# Use sed with proper escaping for macOS/Linux compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i.bak "s/solana_prediction = \"[^\"]*\"/solana_prediction = \"$PROGRAM_ID\"/g" Anchor.toml
else
  # Linux
  sed -i.bak "s/solana_prediction = \"[^\"]*\"/solana_prediction = \"$PROGRAM_ID\"/g" Anchor.toml
fi
rm -f Anchor.toml.bak

# Update lib.rs declare_id! macro
echo "Updating lib.rs declare_id!..."
sed -i.bak "s/declare_id!(\".*\");/declare_id!(\"$PROGRAM_ID\");/" programs/solana_prediction/src/lib.rs
rm -f programs/solana_prediction/src/lib.rs.bak

echo "✅ Program ID synchronized:"
echo "   Anchor.toml: [programs.localnet] solana_prediction = \"$PROGRAM_ID\""
echo "   lib.rs: declare_id!(\"$PROGRAM_ID\");"
echo ""
echo "Run 'anchor build' to compile the program."
