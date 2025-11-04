import { NextRequest, NextResponse } from "next/server";
import { getCreatorProfile } from "@repo/database";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  return res;
}

export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const profile = await getCreatorProfile(params.id);
    if (!profile) return withCors(NextResponse.json({ error: "not_found" }, { status: 404 }));
    return withCors(NextResponse.json({ data: profile }));
  } catch (e: any) {
    return withCors(NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 }));
  }
}
