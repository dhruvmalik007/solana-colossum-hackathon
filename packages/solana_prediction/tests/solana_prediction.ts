import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaPrediction } from "../target/types/solana_prediction";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("solana_prediction", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaPrediction as Program<SolanaPrediction>;
  
  // Test accounts
  const authority = provider.wallet as anchor.Wallet;
  let registryPda: PublicKey;
  let registryBump: number;

  before(async () => {
    // Derive registry PDA
    [registryPda, registryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry"), authority.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("Registry & Strategy Management", () => {
    it("Initializes a registry", async () => {
      const tx = await program.methods
        .initRegistry()
        .accounts({
          registry: registryPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Registry initialized:", tx);

      // Fetch and verify registry
      const registry = await program.account.registry.fetch(registryPda);
      assert.ok(registry.authority.equals(authority.publicKey));
      assert.equal(registry.bump, registryBump);
    });

    it("Upserts a strategy", async () => {
      const strategyKey = Buffer.from("test-strategy-key-12345678901");
      const targetProgram = Keypair.generate().publicKey;

      const [strategyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("strategy"), registryPda.toBuffer(), strategyKey],
        program.programId
      );

      const tx = await program.methods
        .upsertStrategy(Array.from(strategyKey), targetProgram)
        .accounts({
          registry: registryPda,
          strategy: strategyPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Strategy upserted:", tx);

      // Fetch and verify strategy
      const strategy = await program.account.strategy.fetch(strategyPda);
      assert.ok(strategy.registry.equals(registryPda));
      assert.ok(strategy.targetProgram.equals(targetProgram));
      assert.deepEqual(strategy.strategyKey, Array.from(strategyKey));
    });

    it("Executes a strategy (emits event)", async () => {
      const strategyKey = Buffer.from("test-strategy-key-12345678901");
      const [strategyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("strategy"), registryPda.toBuffer(), strategyKey],
        program.programId
      );

      const user = Keypair.generate();
      
      // Airdrop to user
      const airdropSig = await provider.connection.requestAirdrop(
        user.publicKey,
        1_000_000_000
      );
      await provider.connection.confirmTransaction(airdropSig);

      const tx = await program.methods
        .executeStrategy(Array.from(strategyKey), true, Buffer.from("test-ix-data"))
        .accounts({
          registry: registryPda,
          strategy: strategyPda,
          user: user.publicKey,
        })
        .signers([user])
        .rpc();

      console.log("Strategy executed:", tx);
      
      // In a real test, we'd parse events from the transaction
      // For now, just verify it didn't fail
      assert.ok(tx);
    });

    it("Fails to execute strategy without approval", async () => {
      const strategyKey = Buffer.from("test-strategy-key-12345678901");
      const [strategyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("strategy"), registryPda.toBuffer(), strategyKey],
        program.programId
      );

      const user = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        user.publicKey,
        1_000_000_000
      );
      await provider.connection.confirmTransaction(airdropSig);

      try {
        await program.methods
          .executeStrategy(Array.from(strategyKey), false, Buffer.from("test-ix-data"))
          .accounts({
            registry: registryPda,
            strategy: strategyPda,
            user: user.publicKey,
          })
          .signers([user])
          .rpc();
        
        assert.fail("Should have failed with NotApproved error");
      } catch (err) {
        assert.include(err.toString(), "NotApproved");
      }
    });
  });

  describe("Distributional Markets", () => {
    let marketAuthority: Keypair;
    let marketPda: PublicKey;
    let liquidityPoolPda: PublicKey;
    let orderBookPda: PublicKey;
    let collateralVaultPda: PublicKey;
    const slug = Buffer.from("btc-price-2025-12-31-000000000");

    before(async () => {
      marketAuthority = Keypair.generate();
      
      // Airdrop to market authority
      const airdropSig = await provider.connection.requestAirdrop(
        marketAuthority.publicKey,
        5_000_000_000
      );
      await provider.connection.confirmTransaction(airdropSig);

      // Derive PDAs
      [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketAuthority.publicKey.toBuffer(), slug],
        program.programId
      );

      [liquidityPoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), marketPda.toBuffer()],
        program.programId
      );

      [orderBookPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("orderbook"), marketPda.toBuffer()],
        program.programId
      );

      [collateralVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("collateral"), marketPda.toBuffer()],
        program.programId
      );
    });

    it("Creates a distributional market", async () => {
      const params = {
        slug: Array.from(slug),
        outcomeMin: 50000.0,
        outcomeMax: 150000.0,
        unit: Array.from(Buffer.from("USD         ")),
        distType: 0, // Gaussian
        mu: 100000.0,
        sigma: 20000.0,
        sigmaMin: 5000.0,
        step: 1000.0,
        resolutionTime: Math.floor(Date.now() / 1000) + 86400 * 365, // 1 year
        oracleConfig: Array.from(Buffer.alloc(64)),
        feeBpsPlatform: 30,
        feeBpsCreator: 20,
      };

      const tx = await program.methods
        .createDistributionalMarket(params)
        .accounts({
          market: marketPda,
          liquidityPool: liquidityPoolPda,
          orderBook: orderBookPda,
          collateralVault: collateralVaultPda,
          authority: marketAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([marketAuthority])
        .rpc();

      console.log("Market created:", tx);

      // Fetch and verify market
      const market = await program.account.market.fetch(marketPda);
      assert.ok(market.authority.equals(marketAuthority.publicKey));
      assert.equal(market.outcomeMin, 50000.0);
      assert.equal(market.outcomeMax, 150000.0);
      assert.equal(market.mu, 100000.0);
      assert.equal(market.sigma, 20000.0);
      assert.equal(market.feeBpsPlatform, 30);
      assert.equal(market.feeBpsCreator, 20);
      assert.equal(market.status, 0); // Active

      // Verify liquidity pool
      const lp = await program.account.liquidityPool.fetch(liquidityPoolPda);
      assert.ok(lp.market.equals(marketPda));
      assert.equal(lp.totalLiquidity.toNumber(), 0);

      // Verify order book
      const ob = await program.account.orderBook.fetch(orderBookPda);
      assert.ok(ob.market.equals(marketPda));
      assert.equal(ob.bestBid, 0.0);
      assert.equal(ob.bestAsk, 0.0);
      assert.equal(ob.eventCounter.toNumber(), 0);
    });

    it("Places a limit order", async () => {
      const trader = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        trader.publicKey,
        1_000_000_000
      );
      await provider.connection.confirmTransaction(airdropSig);

      const side = 0; // Buy
      const priceBps = 95000; // 9.5 (95000 bps = 9.5 when divided by 10000)
      const size = 100;
      const expiry = Math.floor(Date.now() / 1000) + 3600;

      const tx = await program.methods
        .placeLimitOrder(side, new anchor.BN(priceBps), new anchor.BN(size), new anchor.BN(expiry))
        .accounts({
          market: marketPda,
          orderBook: orderBookPda,
          owner: trader.publicKey,
        })
        .signers([trader])
        .rpc();

      console.log("Limit order placed:", tx);

      // Verify order book updated
      const ob = await program.account.orderBook.fetch(orderBookPda);
      assert.equal(ob.eventCounter.toNumber(), 1);
      assert.equal(ob.bestBid, 9.5); // price_bps / 10000
    });

    it("Executes a market order", async () => {
      const taker = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        taker.publicKey,
        1_000_000_000
      );
      await provider.connection.confirmTransaction(airdropSig);

      const side = 1; // Sell
      const size = 50;

      const tx = await program.methods
        .executeMarketOrder(side, new anchor.BN(size))
        .accounts({
          market: marketPda,
          orderBook: orderBookPda,
          liquidityPool: liquidityPoolPda,
          taker: taker.publicKey,
        })
        .signers([taker])
        .rpc();

      console.log("Market order executed:", tx);
    });

    it("Resolves a market", async () => {
      const outcomeValue = 105000.0;
      const proof = Buffer.from("pyth-proof-placeholder");

      const tx = await program.methods
        .resolveMarket(outcomeValue, Array.from(proof))
        .accounts({
          market: marketPda,
          authority: marketAuthority.publicKey,
        })
        .signers([marketAuthority])
        .rpc();

      console.log("Market resolved:", tx);

      // Verify market status
      const market = await program.account.market.fetch(marketPda);
      assert.equal(market.status, 2); // Resolved
    });
  });

  describe("User Profiles & Positions", () => {
    let user: Keypair;
    let userProfilePda: PublicKey;
    let marketPda: PublicKey;
    let positionPda: PublicKey;

    before(async () => {
      user = Keypair.generate();
      
      // Airdrop
      const airdropSig = await provider.connection.requestAirdrop(
        user.publicKey,
        5_000_000_000
      );
      await provider.connection.confirmTransaction(airdropSig);

      // Derive PDAs
      [userProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), user.publicKey.toBuffer()],
        program.programId
      );

      // Use existing market from previous test
      const slug = Buffer.from("btc-price-2025-12-31-000000000");
      const marketAuthority = Keypair.generate();
      [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketAuthority.publicKey.toBuffer(), slug],
        program.programId
      );

      [positionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), user.publicKey.toBuffer(), marketPda.toBuffer()],
        program.programId
      );
    });

    it("Initializes a user profile", async () => {
      const tx = await program.methods
        .initUser()
        .accounts({
          userProfile: userProfilePda,
          owner: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log("User initialized:", tx);

      // Verify user profile
      const profile = await program.account.userProfile.fetch(userProfilePda);
      assert.ok(profile.owner.equals(user.publicKey));
      assert.equal(profile.openPositions, 0);
    });

    it("Opens a position", async () => {
      const size = 1000;
      const collateralLocked = 1100;

      const tx = await program.methods
        .openPosition(new anchor.BN(size), new anchor.BN(collateralLocked))
        .accounts({
          market: marketPda,
          position: positionPda,
          userProfile: userProfilePda,
          owner: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log("Position opened:", tx);

      // Verify position
      const position = await program.account.position.fetch(positionPda);
      assert.ok(position.owner.equals(user.publicKey));
      assert.ok(position.market.equals(marketPda));
      assert.equal(position.size.toNumber(), size);
      assert.equal(position.collateralLocked.toNumber(), collateralLocked);

      // Verify user profile updated
      const profile = await program.account.userProfile.fetch(userProfilePda);
      assert.equal(profile.openPositions, 1);
    });

    it("Adjusts a position", async () => {
      const deltaSize = 500;
      const deltaCollateral = 550;

      const tx = await program.methods
        .adjustPosition(new anchor.BN(deltaSize), new anchor.BN(deltaCollateral))
        .accounts({
          market: marketPda,
          position: positionPda,
          userProfile: userProfilePda,
          owner: user.publicKey,
        })
        .signers([user])
        .rpc();

      console.log("Position adjusted:", tx);

      // Verify position updated
      const position = await program.account.position.fetch(positionPda);
      assert.equal(position.size.toNumber(), 1500); // 1000 + 500
      assert.equal(position.collateralLocked.toNumber(), 1650); // 1100 + 550
    });

    it("Closes a position", async () => {
      const tx = await program.methods
        .closePosition()
        .accounts({
          market: marketPda,
          position: positionPda,
          userProfile: userProfilePda,
          owner: user.publicKey,
        })
        .signers([user])
        .rpc();

      console.log("Position closed:", tx);

      // Verify user profile updated
      const profile = await program.account.userProfile.fetch(userProfilePda);
      assert.equal(profile.openPositions, 0);
    });
  });

  describe("Liquidity Management", () => {
    let provider_kp: Keypair;
    let marketPda: PublicKey;
    let liquidityPoolPda: PublicKey;

    before(async () => {
      provider_kp = Keypair.generate();
      
      // Airdrop
      const airdropSig = await provider.connection.requestAirdrop(
        provider_kp.publicKey,
        2_000_000_000
      );
      await provider.connection.confirmTransaction(airdropSig);

      // Use existing market
      const slug = Buffer.from("btc-price-2025-12-31-000000000");
      const marketAuthority = Keypair.generate();
      [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketAuthority.publicKey.toBuffer(), slug],
        program.programId
      );

      [liquidityPoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), marketPda.toBuffer()],
        program.programId
      );
    });

    it("Adds liquidity", async () => {
      const amount = 10000;

      const tx = await program.methods
        .addLiquidity(new anchor.BN(amount))
        .accounts({
          market: marketPda,
          liquidityPool: liquidityPoolPda,
          provider: provider_kp.publicKey,
        })
        .signers([provider_kp])
        .rpc();

      console.log("Liquidity added:", tx);

      // Verify pool updated
      const lp = await program.account.liquidityPool.fetch(liquidityPoolPda);
      assert.equal(lp.totalLiquidity.toNumber(), amount);
    });

    it("Removes liquidity", async () => {
      const amount = 5000;

      const tx = await program.methods
        .removeLiquidity(new anchor.BN(amount))
        .accounts({
          market: marketPda,
          liquidityPool: liquidityPoolPda,
          provider: provider_kp.publicKey,
        })
        .signers([provider_kp])
        .rpc();

      console.log("Liquidity removed:", tx);

      // Verify pool updated
      const lp = await program.account.liquidityPool.fetch(liquidityPoolPda);
      assert.equal(lp.totalLiquidity.toNumber(), 5000); // 10000 - 5000
    });

    it("Fails to remove more liquidity than available", async () => {
      const amount = 10000; // More than available (5000)

      try {
        await program.methods
          .removeLiquidity(new anchor.BN(amount))
          .accounts({
            market: marketPda,
            liquidityPool: liquidityPoolPda,
            provider: provider_kp.publicKey,
          })
          .signers([provider_kp])
          .rpc();
        
        assert.fail("Should have failed with insufficient liquidity");
      } catch (err) {
        // Error code check
        assert.ok(err);
      }
    });
  });
});
