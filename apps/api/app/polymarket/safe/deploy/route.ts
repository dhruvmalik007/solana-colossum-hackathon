import { NextRequest, NextResponse } from "next/server";
import { RelayerClientWrapper, BuilderSigning } from "@repo/polymarket-trades/src/index";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  return res;
}

export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

export async function POST(_req: NextRequest) {
  try {
    const clobHost = process.env.POLY_CLOB_HOST || "https://clob.polymarket.com";
    const chainId = Number(process.env.POLY_CHAIN_ID || 137);
    const relayerUrl = process.env.POLY_RELAYER_URL || "https://relayer-v2.polymarket.com";
    const rpcUrl = process.env.RPC_URL || "";
    const eoa = process.env.EOA_PRIVATE_KEY || "";
    const builderSignUrl = process.env.POLY_BUILDER_SIGN_URL; // optional

    if (!rpcUrl) return withCors(NextResponse.json({ error: "RPC_URL not set" }, { status: 500 }));
    if (!eoa) return withCors(NextResponse.json({ error: "EOA_PRIVATE_KEY not set" }, { status: 500 }));

    const client = new RelayerClientWrapper({
      config: { clobHost, chainId: chainId as 137 | 80002, relayerUrl },
      rpc: { rpcUrl },
      signing: builderSignUrl ? { remote: { url: builderSignUrl } } : {},
      walletPrivateKey: eoa,
    });

    const { transactionHash, proxyAddress } = await client.deploySafe();
    return withCors(NextResponse.json({ transactionHash, proxyAddress }, { status: 200 }));
  } catch (e: any) {
    return withCors(NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 }));
  }
}
