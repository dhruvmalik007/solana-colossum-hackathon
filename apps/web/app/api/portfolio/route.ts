import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const pubkey = new PublicKey(walletAddress);

    const balance = await connection.getBalance(pubkey);
    const solBalance = balance / 1e9;

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfg5bgvro5Kg20Xw"),
    });

    const tokenHoldings = tokenAccounts.value
      .filter((acc) => {
        const amount = acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
        return amount > 0;
      })
      .map((acc) => ({
        mint: acc.account.data.parsed?.info?.mint ?? "",
        symbol: "TOKEN",
        amount: acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0,
        value: (acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0) * 1,
      }))
      .slice(0, 10);

    const nftAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfg5bgvro5Kg20Xw"),
    });

    const nftHoldings = nftAccounts.value.filter(
      (acc) => acc.account.data.parsed?.info?.tokenAmount?.decimals === 0
    ).length;

    return NextResponse.json({
      data: {
        walletAddress,
        solBalance,
        tokenHoldings,
        nftHoldings,
      },
    });
  } catch (error: any) {
    console.error("Portfolio fetch error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}
