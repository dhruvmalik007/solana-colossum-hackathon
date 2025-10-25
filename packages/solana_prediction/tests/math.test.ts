import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { SolanaPrediction } from "../target/types/solana_prediction";
import { assert } from "chai";

function padBytes(s: string, len: number): Uint8Array {
  const b = Buffer.alloc(len);
  Buffer.from(s).copy(b);
  return b;
}

describe("solana_prediction program e2e", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolanaPrediction as Program<SolanaPrediction>;
  const wallet = provider.wallet as anchor.Wallet;

  it("init_registry", async () => {
    const [registry] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry"), wallet.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .initRegistry()
      .accounts({ registry, authority: wallet.publicKey, systemProgram: SystemProgram.programId })
      .rpc();
    const reg = await program.account.registry.fetch(registry);
    assert.strictEqual(reg.authority.toBase58(), wallet.publicKey.toBase58());
  });

  it("upsert_strategy", async () => {
    const [registry] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry"), wallet.publicKey.toBuffer()],
      program.programId
    );
    const stratKey = Buffer.alloc(32); stratKey.fill(3);
    const [strategy] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), registry.toBuffer(), stratKey],
      program.programId
    );
    const target = anchor.web3.Keypair.generate().publicKey;
    await program.methods
      .upsertStrategy([...stratKey] as any, target)
      .accounts({ registry, strategy, authority: wallet.publicKey, systemProgram: SystemProgram.programId })
      .rpc();
    const strat = await program.account.strategy.fetch(strategy);
    assert.strictEqual(Buffer.from(strat.strategyKey).toString("hex"), stratKey.toString("hex"));
    assert.strictEqual(strat.targetProgram.toBase58(), target.toBase58());
  });

  it("create_market and initialize infrastructure", async () => {
    const slug = padBytes("BTC_DEC31_2025", 32);
    const unit = padBytes("USD", 12);
    const oracle = padBytes("manual", 64);
    const params = {
      slug: [...slug] as any,
      outcomeMin: 10000.0,
      outcomeMax: 200000.0,
      unit: [...unit] as any,
      distType: 0,
      mu: 50000.0,
      sigma: 10000.0,
      sigmaMin: 1000.0,
      step: 1000.0,
      resolutionTime: new BN(Math.floor(Date.now() / 1000) + 7 * 24 * 3600),
      oracleConfig: [...oracle] as any,
      feeBpsPlatform: 25,
      feeBpsCreator: 25,
    };
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), wallet.publicKey.toBuffer(), Buffer.from(slug)],
      program.programId
    );
    await program.methods
      .createMarket(params as any)
      .accounts({ market, authority: wallet.publicKey, systemProgram: SystemProgram.programId })
      .rpc();
    const acc = await program.account.market.fetch(market);
    assert.strictEqual(acc.authority.toBase58(), wallet.publicKey.toBase58());

    const [pool] = PublicKey.findProgramAddressSync([Buffer.from("pool"), market.toBuffer()], program.programId);
    const [orderbook] = PublicKey.findProgramAddressSync([Buffer.from("orderbook"), market.toBuffer()], program.programId);
    const [collateral] = PublicKey.findProgramAddressSync([Buffer.from("collateral"), market.toBuffer()], program.programId);
    await program.methods
      .initializeMarketInfrastructure()
      .accounts({ market, liquidityPool: pool, orderBook: orderbook, collateralVault: collateral, authority: wallet.publicKey, systemProgram: SystemProgram.programId })
      .rpc();
    const ob = await program.account.orderBook.fetch(orderbook);
    assert.equal(ob.bestBid, 0.0);
    assert.equal(ob.bestAsk, 0.0);
  });

  it("place_limit_order updates best bid/ask", async () => {
    const slug = padBytes("BTC_DEC31_2025", 32);
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), wallet.publicKey.toBuffer(), Buffer.from(slug)],
      program.programId
    );
    const [orderbook] = PublicKey.findProgramAddressSync([Buffer.from("orderbook"), market.toBuffer()], program.programId);
    await program.methods
      .placeLimitOrder(0, new BN(50500), new BN(1), new BN(0))
      .accounts({ market, orderBook: orderbook, owner: wallet.publicKey })
      .rpc();
    let ob = await program.account.orderBook.fetch(orderbook);
    assert.isAbove(ob.bestBid, 0.0);
    await program.methods
      .placeLimitOrder(1, new BN(51500), new BN(1), new BN(0))
      .accounts({ market, orderBook: orderbook, owner: wallet.publicKey })
      .rpc();
    ob = await program.account.orderBook.fetch(orderbook);
    assert.isAbove(ob.bestAsk, 0.0);
  });

  it("execute_market_order routes", async () => {
    const slug = padBytes("BTC_DEC31_2025", 32);
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), wallet.publicKey.toBuffer(), Buffer.from(slug)],
      program.programId
    );
    const [orderbook] = PublicKey.findProgramAddressSync([Buffer.from("orderbook"), market.toBuffer()], program.programId);
    const [pool] = PublicKey.findProgramAddressSync([Buffer.from("pool"), market.toBuffer()], program.programId);
    await program.methods
      .executeMarketOrder(0, new BN(2))
      .accounts({ market, orderBook: orderbook, liquidityPool: pool, taker: wallet.publicKey })
      .rpc();
  });

  it("init_pmamm and trade buy/sell adjusts pool", async () => {
    const slug = padBytes("BTC_DEC31_2025", 32);
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), wallet.publicKey.toBuffer(), Buffer.from(slug)],
      program.programId
    );
    const [pmamm] = PublicKey.findProgramAddressSync([Buffer.from("pmamm"), market.toBuffer()], program.programId);
    // Initialize if not exists
    let needInit = false;
    try { await program.account.pmAmmPool.fetch(pmamm); } catch { needInit = true; }
    if (needInit) {
      await program.methods
        .initPmamm(new BN(100_000), true, 50, new BN(Math.floor(Date.now() / 1000) + 3600))
        .accounts({ market, pmammPool: pmamm, authority: wallet.publicKey, systemProgram: SystemProgram.programId })
        .rpc();
    }
    const before = await program.account.pmAmmPool.fetch(pmamm);
    await program.methods
      .tradePmamm(0, new BN(10))
      .accounts({ market, pmammPool: pmamm, taker: wallet.publicKey })
      .rpc();
    let after = await program.account.pmAmmPool.fetch(pmamm);
    assert.isAtMost(after.x.toNumber ? after.x.toNumber() : after.x, (before.x.toNumber ? before.x.toNumber() : before.x));
    assert.isAtLeast(after.y.toNumber ? after.y.toNumber() : after.y, (before.y.toNumber ? before.y.toNumber() : before.y));

    await program.methods
      .tradePmamm(1, new BN(7))
      .accounts({ market, pmammPool: pmamm, taker: wallet.publicKey })
      .rpc();
    after = await program.account.pmAmmPool.fetch(pmamm);
    assert.isAtLeast(after.x.toNumber ? after.x.toNumber() : after.x, 0);
  });

  it("trade_pmamm rejects after expiry", async () => {
    const slug = padBytes("EXPIRED_MKT", 32);
    const unit = padBytes("USD", 12);
    const oracle = padBytes("manual", 64);
    const params = {
      slug: [...slug] as any,
      outcomeMin: 0.0,
      outcomeMax: 1.0,
      unit: [...unit] as any,
      distType: 0,
      mu: 0.0,
      sigma: 1.0,
      sigmaMin: 0.1,
      step: 0.1,
      resolutionTime: new BN(Math.floor(Date.now() / 1000) + 300),
      oracleConfig: [...oracle] as any,
      feeBpsPlatform: 0,
      feeBpsCreator: 0,
    };
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), wallet.publicKey.toBuffer(), Buffer.from(slug)],
      program.programId
    );
    await program.methods
      .createMarket(params as any)
      .accounts({ market, authority: wallet.publicKey, systemProgram: SystemProgram.programId })
      .rpc();
    const [pmamm] = PublicKey.findProgramAddressSync([Buffer.from("pmamm"), market.toBuffer()], program.programId);
    await program.methods
      .initPmamm(new BN(10_000), true, 50, new BN(Math.floor(Date.now() / 1000) - 5))
      .accounts({ market, pmammPool: pmamm, authority: wallet.publicKey, systemProgram: SystemProgram.programId })
      .rpc();
    let failed = false;
    try {
      await program.methods
        .tradePmamm(0, new BN(1))
        .accounts({ market, pmammPool: pmamm, taker: wallet.publicKey })
        .rpc();
    } catch {
      failed = true;
    }
    assert.isTrue(failed);
  });
});
