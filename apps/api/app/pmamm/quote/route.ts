import { NextRequest } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

type PmAmmPool = {
  market: PublicKey;
  x: number;
  y: number;
  l0: number;
  dynamic_on: number;
  fee_bps: number;
  expiry_ts: number;
  bump: number;
};

function decodePmAmmPool(data: Buffer): PmAmmPool {
  if (data.length < 8 + 32 + 8 + 8 + 8 + 1 + 2 + 8 + 1) throw new Error("account data too short");
  let o = 8; // skip discriminator
  const market = new PublicKey(data.subarray(o, o + 32)); o += 32;
  const x = Number(data.readBigUInt64LE(o)); o += 8;
  const y = Number(data.readBigUInt64LE(o)); o += 8;
  const l0 = Number(data.readBigUInt64LE(o)); o += 8;
  const dynamic_on = data.readUInt8(o); o += 1;
  const fee_bps = data.readUInt16LE(o); o += 2;
  const expiry_ts = Number(data.readBigInt64LE(o)); o += 8;
  const bump = data.readUInt8(o); o += 1;
  return { market, x, y, l0, dynamic_on, fee_bps, expiry_ts, bump };
}

function effectiveLiquidity(l0: number, dynamic_on: number, expiry_ts: number, now_ts: number): number {
  if (dynamic_on === 0) return l0;
  const dt = Math.max(expiry_ts - now_ts, 1);
  let L = l0 * Math.sqrt(dt);
  if (!Number.isFinite(L) || L <= 0) L = l0;
  const cap = l0 * 1_000_000;
  return Math.min(L, cap);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const marketStr = searchParams.get("market");
    const sideStr = searchParams.get("side");
    const sizeStr = searchParams.get("size");
    const cluster = (searchParams.get("cluster") || "devnet") as "devnet" | "mainnet-beta";

    if (!marketStr || sideStr === null || !sizeStr)
      return new Response(JSON.stringify({ error: "market, side, size required" }), { status: 400 });

    const side = Number(sideStr);
    const size = Number(sizeStr);
    if (!(side === 0 || side === 1) || !(size > 0))
      return new Response(JSON.stringify({ error: "invalid side or size" }), { status: 400 });

    const market = new PublicKey(marketStr);
    const programIdStr = process.env.SOLANA_PROGRAM_ID || process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID;
    if (!programIdStr)
      return new Response(JSON.stringify({ error: "SOLANA_PROGRAM_ID not set" }), { status: 500 });

    const rpc = cluster === "mainnet-beta"
      ? (process.env.SOLANA_MAINNET_RPC || process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || "https://api.mainnet-beta.solana.com")
      : (process.env.SOLANA_DEVNET_RPC || process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com");
    const connection = new Connection(rpc, "confirmed");

    // Derive pmamm pool PDA
    const [pmammPda] = PublicKey.findProgramAddressSync([Buffer.from("pmamm"), market.toBuffer()], new PublicKey(programIdStr));

    const acct = await connection.getAccountInfo(pmammPda);
    if (!acct)
      return new Response(JSON.stringify({ error: "PmAmmPool not found for market" }), { status: 404 });

    const pool = decodePmAmmPool(Buffer.from(acct.data));
    const now = Math.floor(Date.now() / 1000);
    if (now >= pool.expiry_ts)
      return new Response(JSON.stringify({ error: "market expired" }), { status: 400 });

    const L = effectiveLiquidity(pool.l0, pool.dynamic_on, pool.expiry_ts, now);
    let vx = pool.x + L / 2;
    let vy = pool.y + L / 2;
    const k = vx * vy;

    const s = size;
    let deltaY = 0;
    if (side === 0) {
      const maxBuy = Math.max(vx - 1, 0);
      const buy = Math.min(s, maxBuy);
      const newVx = Math.max(vx - buy, 1);
      const newVy = k / newVx;
      deltaY = Math.max(newVy - vy, 0);
      vx = newVx; vy = newVy;
    } else {
      const newVx = vx + s;
      const newVy = Math.max(k / newVx, 0);
      deltaY = Math.max(vy - newVy, 0);
      vx = newVx; vy = newVy;
    }

    const fee = Math.max(deltaY * (pool.fee_bps / 10_000), 0);
    const notional = side === 0 ? (deltaY + fee) : Math.max(deltaY - fee, 0); // mirror on-chain
    const price = s > 0 ? notional / s : 0;
    const price_bps = Math.round(price * 10_000);

    return new Response(JSON.stringify({
      ok: true,
      market: marketStr,
      pmammPool: pmammPda.toBase58(),
      L,
      side,
      size,
      price,
      price_bps,
      fee,
      notional,
      pool: {
        x: pool.x,
        y: pool.y,
        l0: pool.l0,
        dynamic_on: pool.dynamic_on,
        fee_bps: pool.fee_bps,
        expiry_ts: pool.expiry_ts,
      },
      cluster,
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": process.env.WEB_ORIGIN || "*",
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "GET, OPTIONS",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": process.env.WEB_ORIGIN || "*",
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "GET, OPTIONS",
      },
    });
  }
}

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": process.env.WEB_ORIGIN || "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET, OPTIONS",
    },
  });
}
