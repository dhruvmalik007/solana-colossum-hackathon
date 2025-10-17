import { NextRequest, NextResponse } from "next/server";
import { putOrder, Order } from "@repo/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const marketId = typeof body?.marketId === "string" ? body.marketId : (typeof body?.slug === "string" ? body.slug : "");
    const side = body?.side === "Buy" || body?.side === "Sell" ? body.side : undefined;
    const price = Number(body?.price);
    const size = Number(body?.size);
    if (!marketId) return NextResponse.json({ error: "marketId (or slug) required" }, { status: 400 });
    if (!side) return NextResponse.json({ error: "side must be 'Buy' or 'Sell'" }, { status: 400 });
    if (!isFinite(price) || price <= 0) return NextResponse.json({ error: "price must be > 0" }, { status: 400 });
    if (!isFinite(size) || size <= 0) return NextResponse.json({ error: "size must be > 0" }, { status: 400 });

    const id = `${marketId}:${Date.now()}:${Math.random().toString(36).slice(2,8)}`;
    const now = new Date().toISOString();
    const order: Order = {
      id,
      marketId,
      side,
      price,
      size,
      remaining: size,
      status: "Open",
      createdAt: now,
    };
    await putOrder(order);
    return NextResponse.json({ data: order }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
  }
}
