import { NextRequest, NextResponse } from "next/server";
import { Embed, listEmbedsByMarket, putEmbed } from "@repo/database";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return res;
}
export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const marketId = url.searchParams.get("marketId");
    if (!marketId) return withCors(NextResponse.json({ error: "marketId required" }, { status: 400 }));
    const data = await listEmbedsByMarket(marketId);
    return withCors(NextResponse.json({ data }));
  } catch (e) {
    console.error("[api] /embeds GET error", e);
    return withCors(NextResponse.json({ error: "server error" }, { status: 500 }));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const marketId = typeof body?.marketId === "string" ? body.marketId : "";
    const url = typeof body?.url === "string" ? body.url : "";
    const source = typeof body?.source === "string" ? body.source : "Other";
    if (!marketId || !url) return withCors(NextResponse.json({ error: "marketId and url required" }, { status: 400 }));
    const id = `e_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const createdAt = new Date().toISOString();
    const embed: Embed = { id, marketId, url, source, createdAt };
    await putEmbed(embed);
    return withCors(NextResponse.json({ data: embed }, { status: 201 }));
  } catch (e) {
    console.error("[api] /embeds POST error", e);
    return withCors(NextResponse.json({ error: "server error" }, { status: 500 }));
  }
}
