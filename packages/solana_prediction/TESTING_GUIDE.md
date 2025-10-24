# Testing Guide - Solana Prediction Markets

Quick guide to running tests for the `solana_prediction` Anchor program.

---

## Quick Start

### 1. Install Dependencies
```bash
cd packages/solana_prediction
npm install
```

### 2. Build Program (Generates IDL)
```bash
anchor build
```

### 3. Run All Tests
```bash
anchor test
```

---

## Test Commands

### Run All Tests
```bash
npm test
# or
anchor test
```

### Run Unit Tests Only (Math Module)
```bash
npm run test:unit
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run with Verbose Logging
```bash
npm run test:verbose
# or
ANCHOR_LOG=true anchor test
```

### Run Specific Test Suite
```bash
anchor test --skip-deploy -- --grep "Registry"
anchor test --skip-deploy -- --grep "Markets"
anchor test --skip-deploy -- --grep "Positions"
```

### Run Against Devnet
```bash
anchor test --provider.cluster devnet
```

---

## Test Files

- **`tests/solana_prediction.ts`** - Integration tests for all instructions
- **`tests/math.test.ts`** - Unit tests for math.rs module
- **`TEST_ANALYSIS.md`** - Comprehensive test coverage analysis

---

## Test Coverage

| Module | Coverage | Test Count |
|--------|----------|------------|
| Registry & Strategy | 100% | 4 tests |
| Distributional Markets | 90% | 5 tests |
| User Profiles & Positions | 100% | 4 tests |
| Liquidity Management | 90% | 3 tests |
| Math Module | 100% | 8 property tests |

**Total**: 24 tests covering 16 instructions

---

## Prerequisites

### Required Tools
- **Solana CLI** v1.18+
- **Anchor CLI** v0.29.0
- **Node.js** v18+
- **Rust** v1.75+

### Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

### Install Anchor CLI
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0
```

### Verify Installation
```bash
solana --version
anchor --version
node --version
```

---

## Running Tests Locally

### 1. Start Local Validator (Optional)
```bash
solana-test-validator
```

### 2. Run Tests
```bash
# In another terminal
anchor test --skip-local-validator
```

### 3. View Test Results
Tests will output:
- ✅ Passed tests (green)
- ❌ Failed tests (red)
- Transaction signatures
- Account states

---

## Debugging Failed Tests

### Enable Detailed Logs
```bash
export RUST_LOG=solana_runtime::system_instruction_processor=trace
export ANCHOR_LOG=true
anchor test
```

### Common Issues

**1. Airdrop Failures**
```
Error: Airdrop request failed
```
**Solution**: Use localnet or retry with different devnet RPC

**2. Account Not Found**
```
Error: Account does not exist
```
**Solution**: Ensure program is built and deployed

**3. Transaction Timeout**
```
Error: Transaction was not confirmed
```
**Solution**: Increase timeout or check network status

**4. PDA Derivation Error**
```
Error: Seeds constraint violated
```
**Solution**: Verify PDA seeds match program logic

---

## Writing New Tests

### Test Template
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaPrediction } from "../target/types/solana_prediction";
import { assert } from "chai";

describe("My Feature", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolanaPrediction as Program<SolanaPrediction>;

  it("does something", async () => {
    // Arrange
    const user = anchor.web3.Keypair.generate();
    
    // Act
    const tx = await program.methods
      .myInstruction()
      .accounts({ /* ... */ })
      .signers([user])
      .rpc();
    
    // Assert
    assert.ok(tx);
  });
});
```

### Best Practices
1. **Arrange-Act-Assert** pattern
2. **Descriptive test names**: "succeeds when...", "fails when..."
3. **Clean up**: Close accounts after tests
4. **Isolation**: Each test should be independent
5. **Assertions**: Always verify expected state changes

---

## CI/CD Integration

### GitHub Actions
Tests run automatically on push/PR via `.github/workflows/deploy-solana-program.yml`

### Manual Trigger
```bash
# Via GitHub UI: Actions → Deploy Solana Program → Run workflow
```

---

## Performance Benchmarks

| Operation | Time | Compute Units |
|-----------|------|---------------|
| Create Market | ~50ms | ~200k CU |
| Place Order | ~10ms | ~50k CU |
| Open Position | ~30ms | ~100k CU |
| Add Liquidity | ~10ms | ~50k CU |

---

## Test Data

### Sample Accounts
- **Registry**: PDA("registry", authority)
- **Market**: PDA("market", authority, slug)
- **Position**: PDA("position", owner, market)
- **User**: PDA("user", owner)

### Sample Parameters
```typescript
{
  outcomeMin: 50000.0,
  outcomeMax: 150000.0,
  mu: 100000.0,
  sigma: 20000.0,
  feeBpsPlatform: 30,
  feeBpsCreator: 20,
}
```

---

## Next Steps

1. ✅ Run `npm install` to install test dependencies
2. ✅ Run `anchor build` to generate IDL types
3. ✅ Run `anchor test` to execute all tests
4. ⏳ Review `TEST_ANALYSIS.md` for detailed coverage
5. ⏳ Add new tests for custom features

---

## Resources

- [Anchor Testing Docs](https://www.anchor-lang.com/docs/testing)
- [Solana Test Validator](https://docs.solana.com/developing/test-validator)
- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertions](https://www.chaijs.com/api/assert/)

---

## Support

For test failures or questions:
1. Check `TEST_ANALYSIS.md` for known issues
2. Enable verbose logging
3. Review transaction logs in Solana Explorer
4. Check Anchor version compatibility
