import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export type Suggestion = {
  id: string;
  title: string;
  description: string;
  votes: number;
  createdAt: string; // ISO
  author?: string;
};

const sample: Suggestion[] = [
  {
    id: "d79c2d8a-4a6c-42a1-8d1e-dfe6c3d5f6b1",
    title: "Will Solana TVL surpass $10B by Q2 2025?",
    description: "Track the total value locked across all Solana DeFi protocols",
    votes: 45,
    createdAt: "2025-10-01T09:12:23.123Z",
    author: "builder01",
  },
  {
    id: "8b7e961e-27f0-4b68-8905-df6e9b9dfee8",
    title: "Will Jupiter DEX volume exceed $100B in 2025?",
    description: "Measure trading volume on Jupiter aggregator",
    votes: 32,
    createdAt: "2025-10-02T14:30:45.000Z",
  },
  {
    id: "a2f1c8f9-3303-4b7e-81e5-6723b9b8c31a",
    title: "Will Marinade staked SOL reach 50M SOL?",
    description: "Monitor liquid staking adoption on Marinade Finance",
    votes: 28,
    createdAt: "2025-10-10T18:45:22.789Z",
    author: "defi-analyst",
  },
];

export async function GET(_req: NextRequest) {
  try {
    const res = NextResponse.json({ data: sample });
    res.headers.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
    return withCors(res);
  } catch (e: any) {
    return withCors(NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 }));
  }
}
