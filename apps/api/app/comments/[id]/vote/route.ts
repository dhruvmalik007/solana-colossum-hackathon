import { NextRequest, NextResponse } from "next/server";
import { updateCommentVotes } from "@repo/database";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  return res;
}

export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return withCors(NextResponse.json({ error: "missing id" }, { status: 400 }));
    const body = await req.json().catch(() => ({} as any));
    const dir = Number(body?.dir);
    if (![1, -1].includes(dir)) return withCors(NextResponse.json({ error: "dir must be +1 or -1" }, { status: 400 }));
    await updateCommentVotes(id, dir);
    return withCors(NextResponse.json({ ok: true }));
  } catch (e) {
    console.error("[api] /comments/[id]/vote POST error", e);
    return withCors(NextResponse.json({ error: "server error" }, { status: 500 }));
  }
}

