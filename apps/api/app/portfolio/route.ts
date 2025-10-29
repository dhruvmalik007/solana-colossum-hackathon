import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  return res;
}

export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();
    if (!walletAddress) return withCors(NextResponse.json({ error: "Wallet address required" }, { status: 400 }));
    const connection = new Connection(RPC_URL, "confirmed");
    const pubkey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(pubkey);
    const solBalance = balance / 1e9;
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, { programId: new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfg5bgvro5Kg20Xw") });
    const tokenHoldings = tokenAccounts.value
      .filter((acc) => (acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0) > 0)
      .map((acc) => ({ mint: acc.account.data.parsed?.info?.mint ?? "", symbol: "TOKEN", amount: acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0, value: (acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0) * 1 }))
      .slice(0, 10);
    const nftAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, { programId: new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfg5bgvro5Kg20Xw") });
    const nftHoldings = nftAccounts.value.filter((acc) => acc.account.data.parsed?.info?.tokenAmount?.decimals === 0).length;
    return withCors(NextResponse.json({ data: { walletAddress, solBalance, tokenHoldings, nftHoldings } }));
  } catch (error: any) {
    return withCors(NextResponse.json({ error: error?.message ?? "Failed to fetch portfolio" }, { status: 500 }));
  }
}
