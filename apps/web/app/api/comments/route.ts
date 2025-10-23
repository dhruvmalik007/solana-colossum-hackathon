import { NextRequest, NextResponse } from "next/server";
import { Comment, listCommentsByMarket, putComment } from "@repo/database";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const marketId = url.searchParams.get("marketId");
    if (!marketId) return NextResponse.json({ error: "marketId required" }, { status: 400 });
    const data = await listCommentsByMarket(marketId);
    return NextResponse.json({ data });
  } catch (e) {
    console.error("/api/comments GET error", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const marketId = typeof body?.marketId === "string" ? body.marketId : "";
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const parentId = typeof body?.parentId === "string" ? body.parentId : undefined;
    const userId = typeof body?.userId === "string" ? body.userId : "anonymous";
    if (!marketId || !text) return NextResponse.json({ error: "marketId and text required" }, { status: 400 });
    const id = (global as any).crypto?.randomUUID?.() || `c_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const createdAt = new Date().toISOString();
    const comment: Comment = { id, marketId, userId, parentId, text, votes: 0, createdAt };
    await putComment(comment);
    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (e) {
    console.error("/api/comments POST error", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
