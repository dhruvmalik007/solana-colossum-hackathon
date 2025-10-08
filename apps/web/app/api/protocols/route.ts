import { NextResponse } from "next/server";
import { getSolanaProtocolsCached } from "../../../lib/server/defillama";

export const dynamic = "force-dynamic"; // always hit file cache, not Next data cache

export async function GET() {
  try {
    console.log("[/api/protocols] GET request received");
    const data = await getSolanaProtocolsCached();
    console.log("[/api/protocols] data length:", data?.length ?? 0);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/protocols] error:", msg);
    return NextResponse.json({ error: msg || "failed" }, { status: 500 });
  }
}
