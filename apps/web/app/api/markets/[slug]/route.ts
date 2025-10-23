import { NextRequest, NextResponse } from "next/server";
import { getMarketBySlug } from "@repo/database";

export async function GET(_req: NextRequest, ctx: { params: { slug: string } }) {
  try {
    const slug = ctx?.params?.slug;
    if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });
    const m = await getMarketBySlug(slug);
    if (!m) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ data: m });
  } catch (e) {
    console.error("/api/markets/[slug] GET error", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
