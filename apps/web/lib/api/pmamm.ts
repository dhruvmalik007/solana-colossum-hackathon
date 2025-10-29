export type QuoteRequest = {
  market: string;
  side: 0 | 1;
  size: number;
  cluster?: "devnet" | "mainnet-beta";
};

export type QuoteResponse = {
  ok: boolean;
  market: string;
  pmammPool: string;
  L: number;
  side: number;
  size: number;
  price: number;
  price_bps: number;
  fee: number;
  notional: number;
  pool: {
    x: number;
    y: number;
    l0: number;
    dynamic_on: number;
    fee_bps: number;
    expiry_ts: number;
  };
  cluster: "devnet" | "mainnet-beta";
};

export type TradeRequest = {
  market: string;
  side: 0 | 1;
  size: number;
  taker: string;
  cluster?: "devnet" | "mainnet-beta";
};

export type TradeResponse = {
  ok: boolean;
  tx: string;
  lastValidBlockHeight: number;
};

function baseUrl() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL not set");
  return url.replace(/\/$/, "");
}

export async function getQuote(params: QuoteRequest): Promise<QuoteResponse> {
  const u = new URL(baseUrl() + "/pmamm/quote");
  u.searchParams.set("market", params.market);
  u.searchParams.set("side", String(params.side));
  u.searchParams.set("size", String(params.size));
  if (params.cluster) u.searchParams.set("cluster", params.cluster);
  const res = await fetch(u.toString(), { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createTradeTx(params: TradeRequest): Promise<TradeResponse> {
  const res = await fetch(baseUrl() + "/pmamm/trade", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
