import { NextRequest, NextResponse } from "next/server";
import {
  BuilderSigning,
  ClobClientWrapper,
  MarketInfoService,
  OrdersService,
  OrderType,
  Side,
} from "@repo/polymarket-trades/src/index";


function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  return res;
}

export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    // Required inputs
    const marketIdOrToken = String(body?.marketIdOrToken || body?.tokenId || body?.marketId || "").trim();
    const gaussian = body?.gaussian as {
      mean: number;
      sigma: number;
      levels: number;
      spacing: "sigma" | "fixed";
      side: "BUY" | "SELL" | "Buy" | "Sell";
      totalSize: number;
      minPerOrder: number;
      clamp?: { min: number; max: number };
    };
    const policy = body?.policy as {
      maxTotalSize: number;
      minPerOrder: number;
      maxPerOrder?: number;
      maxSkewPct?: number;
    };
    const orderTypeStr = String(body?.orderType || "GTC");

    if (!marketIdOrToken) return withCors(NextResponse.json({ error: "marketIdOrToken required" }, { status: 400 }));
    if (!gaussian || !Number.isFinite(gaussian.mean) || !Number.isFinite(gaussian.sigma) || !Number.isFinite(gaussian.levels)) {
      return withCors(NextResponse.json({ error: "invalid gaussian params" }, { status: 400 }));
    }
    if (!policy || !Number.isFinite(policy.maxTotalSize) || !Number.isFinite(policy.minPerOrder)) {
      return withCors(NextResponse.json({ error: "invalid liquidity policy" }, { status: 400 }));
    }

    // Env config
    const clobHost = process.env.POLY_CLOB_HOST || "https://clob.polymarket.com";
    const chainId = Number(process.env.POLY_CHAIN_ID || 137);
    const relayerUrl = process.env.POLY_RELAYER_URL || "https://relayer-v2.polymarket.com";
    const rpcUrl = process.env.RPC_URL || "";
    const eoa = process.env.EOA_PRIVATE_KEY || "";
    const builderSignUrl = process.env.POLY_BUILDER_SIGN_URL; // e.g., http://localhost:3000/sign
    const signatureType = Number(process.env.POLY_SIGNATURE_TYPE || 0) as 0 | 1;
    const funder = process.env.POLY_FUNDER_ADDRESS; // optional

    if (!rpcUrl) return withCors(NextResponse.json({ error: "RPC_URL not set" }, { status: 500 }));
    if (!eoa) return withCors(NextResponse.json({ error: "EOA_PRIVATE_KEY not set" }, { status: 500 }));

    const polymarketConfig = { clobHost, chainId: chainId as 137 | 80002, relayerUrl };
    const marketInfo = new MarketInfoService(polymarketConfig);

    const clob = new ClobClientWrapper({
      config: polymarketConfig,
      eoaPrivateKey: eoa,
      signatureType,
      funderAddress: funder,
      builderSigning: builderSignUrl ? { remote: { url: builderSignUrl } } : undefined,
      rpcUrl,
    });

    await clob.initApiAuth();

    const svc = new OrdersService(clob, marketInfo);

    const side = /buy/i.test(gaussian.side) ? Side.BUY : Side.SELL;
    const ot: OrderType = /gtd/i.test(orderTypeStr)
      ? OrderType.GTD
      : /fok/i.test(orderTypeStr)
      ? OrderType.FOK
      : OrderType.GTC;

    const result = await svc.placeGaussianBatch(
      marketIdOrToken,
      {
        mean: Number(gaussian.mean),
        sigma: Number(gaussian.sigma),
        levels: Number(gaussian.levels),
        spacing: gaussian.spacing,
        side,
        totalSize: Number(gaussian.totalSize),
        minPerOrder: Number(gaussian.minPerOrder),
        clamp: gaussian.clamp,
      },
      {
        maxTotalSize: Number(policy.maxTotalSize),
        minPerOrder: Number(policy.minPerOrder),
        maxPerOrder: policy.maxPerOrder != null ? Number(policy.maxPerOrder) : undefined,
        maxSkewPct: policy.maxSkewPct != null ? Number(policy.maxSkewPct) : undefined,
      },
      ot
    );

    return withCors(NextResponse.json({ data: result }, { status: 200 }));
  } catch (e: any) {
    return withCors(NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 }));
  }
}
