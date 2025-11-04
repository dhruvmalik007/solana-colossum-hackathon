import { NextRequest, NextResponse } from "next/server";
import { listCreatorProfiles } from "@repo/database";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  return res;
}

export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 20);
    const q = url.searchParams.get("q") || undefined;
    const data = await listCreatorProfiles({ page, pageSize, q });
    return withCors(NextResponse.json({ data, page, pageSize }));
  } catch (e: any) {
    return withCors(NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 }));
  }
}
