import { NextRequest, NextResponse } from "next/server";
import { listMarkets, putMarket, Market } from "@repo/database";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

export async function GET() {
  const items = await listMarkets();
  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description : undefined;
  const category = typeof body?.category === "string" ? body.category : undefined;
  const resolutionTime = typeof body?.resolutionTime === "string" ? body.resolutionTime : undefined;
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const slug = slugify(title);
  const now = new Date().toISOString();
  const market: Market = {
    id: slug,
    slug,
    title,
    description,
    category,
    createdAt: now,
    resolutionTime,
    status: "Active",
  };
  await putMarket(market);
  return NextResponse.json({ data: market }, { status: 201 });
}
