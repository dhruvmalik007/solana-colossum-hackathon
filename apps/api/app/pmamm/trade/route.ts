import { NextRequest } from "next/server";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { createHash } from "crypto";

function sighash(name: string) {
  const preimage = Buffer.from(`global:${name}`);
  const hash = createHash("sha256").update(preimage).digest();
  return hash.subarray(0, 8);
}

function u64le(n: number) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(Math.floor(n)));
  return b;
}

function decodePmAmmPool(data: Buffer) {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const marketStr: string = body.market;
    const side: number = body.side;
    const size: number = body.size;
    const takerStr: string = body.taker;
    const cluster: "devnet" | "mainnet-beta" = body.cluster || "devnet";

    if (!marketStr || !(side === 0 || side === 1) || !(size > 0) || !takerStr) {
      return new Response(JSON.stringify({ error: "market, side(0|1), size>0, taker required" }), { status: 400 });
    }

    const programIdStr = process.env.SOLANA_PROGRAM_ID || process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID;
    if (!programIdStr) return new Response(JSON.stringify({ error: "SOLANA_PROGRAM_ID not set" }), { status: 500 });

    const rpc = cluster === "mainnet-beta"
      ? (process.env.SOLANA_MAINNET_RPC || process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || "https://api.mainnet-beta.solana.com")
      : (process.env.SOLANA_DEVNET_RPC || process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com");
    const connection = new Connection(rpc, "confirmed");

    const market = new PublicKey(marketStr);
    const taker = new PublicKey(takerStr);
    const programId = new PublicKey(programIdStr);

    // Derive pmamm pool PDA
    const [pmammPda] = PublicKey.findProgramAddressSync([Buffer.from("pmamm"), market.toBuffer()], programId);

    // Optional: sanity check not expired
    const acct = await connection.getAccountInfo(pmammPda);
    if (!acct) return new Response(JSON.stringify({ error: "PmAmmPool not found for market" }), { status: 404 });
    const pool = decodePmAmmPool(Buffer.from(acct.data));
    const now = Math.floor(Date.now() / 1000);
    if (now >= pool.expiry_ts) return new Response(JSON.stringify({ error: "market expired" }), { status: 400 });

    // Build Anchor instruction data: 8-byte discriminator + u8 side + u64 size
    const disc = sighash("trade_pmamm");
    const data = Buffer.concat([disc, Buffer.from([side & 0xff]), u64le(size)]);

    const keys = [
      { pubkey: market, isSigner: false, isWritable: false },
      { pubkey: pmammPda, isSigner: false, isWritable: true },
      { pubkey: taker, isSigner: true, isWritable: false },
    ];

    const ix = new TransactionInstruction({ programId, keys, data });
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const tx = new Transaction({ feePayer: taker, recentBlockhash: blockhash });
    tx.add(ix);

    const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");

    return new Response(
      JSON.stringify({ ok: true, tx: serialized, lastValidBlockHeight }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": process.env.WEB_ORIGIN || "*",
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "POST, OPTIONS",
        },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": process.env.WEB_ORIGIN || "*",
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "POST, OPTIONS",
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
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}
