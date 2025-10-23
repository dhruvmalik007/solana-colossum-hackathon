import { NextRequest, NextResponse } from "next/server";
import { updateCommentVotes } from "@repo/database";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx?.params?.id;
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
    const body = await req.json().catch(() => ({
      
    } as any));
    const dir = Number(body?.dir);
    if (![1, -1].includes(dir)) return NextResponse.json({ error: "dir must be +1 or -1" }, { status: 400 });
    await updateCommentVotes(id, dir);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("/api/comments/[id]/vote POST error", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
