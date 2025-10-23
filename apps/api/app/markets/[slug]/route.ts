import { NextResponse } from "next/server";
import { getMarketBySlug } from "@repo/database";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  return res;
}

export async function GET(_req: Request, ctx: { params: { slug: string } }) {
  try {
    const slug = ctx?.params?.slug;
    if (!slug) return withCors(NextResponse.json({ error: "missing slug" }, { status: 400 }));
    const m = await getMarketBySlug(slug);
    if (!m) return withCors(NextResponse.json({ error: "not found" }, { status: 404 }));
    return withCors(NextResponse.json({ data: m }));
  } catch (e) {
    console.error("[api] /markets/[slug] GET error", e);
    return withCors(NextResponse.json({ error: "server error" }, { status: 500 }));
  }
}
