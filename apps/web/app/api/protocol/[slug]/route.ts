import { NextResponse } from "next/server";
import { getProtocolDetailSlimCached } from "../../../../lib/server/defillama";

export const dynamic = "force-dynamic"; // always hit file cache, not Next data cache

export async function GET(_req: Request, ctx: { params: any}) {
  try {
    const { slug } = ctx.params;
    const data = await getProtocolDetailSlimCached(slug);
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
