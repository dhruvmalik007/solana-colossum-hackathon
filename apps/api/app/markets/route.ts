import { NextRequest, NextResponse } from "next/server";
import { listMarkets, putMarket, Market } from "@repo/database";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(req: NextRequest) {
  try {
    let items = await listMarkets();
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const q = url.searchParams.get("q");
    const limitParam = url.searchParams.get("limit");
    const cursorParam = url.searchParams.get("cursor");
    const status = url.searchParams.get("status");
    const sort = url.searchParams.get("sort") || "Newest";

    if (category && category !== "All") {
      items = items.filter((m) => (m.category || "").toLowerCase() === category.toLowerCase());
    }
    if (q && q.trim()) {
      const s = q.trim().toLowerCase();
      items = items.filter((m) =>
        m.title.toLowerCase().includes(s) || (m.description || "").toLowerCase().includes(s)
      );
    }

    if (status && status !== "All") {
      items = items.filter((m) => (m.status || "").toLowerCase() === status.toLowerCase());
    }

    if (sort === "EndingSoon") {
      items.sort((a, b) => {
        const ta = a.resolutionTime ? new Date(a.resolutionTime).getTime() : Number.POSITIVE_INFINITY;
        const tb = b.resolutionTime ? new Date(b.resolutionTime).getTime() : Number.POSITIVE_INFINITY;
        return ta - tb;
      });
    } else {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = items.length;
    const limit = Math.max(1, Math.min(100, Number(limitParam) || 24));
    const offset = Math.max(0, Number(cursorParam) || 0);
    const page = items.slice(offset, offset + limit);
    const nextOffset = offset + page.length;
    const nextCursor = nextOffset < total ? String(nextOffset) : null;

    return withCors(NextResponse.json({ data: page, nextCursor, total }));
  } catch (e) {
    console.error("[api] /markets GET error", e);
    return withCors(NextResponse.json({ data: [] }, { status: 200 }));
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description : undefined;
  const category = typeof body?.category === "string" ? body.category : undefined;
  const resolutionTime = typeof body?.resolutionTime === "string" ? body.resolutionTime : undefined;
  if (!title) return withCors(NextResponse.json({ error: "title is required" }, { status: 400 }));
  const slug = slugify(title);
  const now = new Date().toISOString();
  const market: Market = {
    id: slug,
    slug,
    title,
    description,
    category,
    createdAt: now,
    resolutionTime,
    status: "Active",
  };
  await putMarket(market);
  return withCors(NextResponse.json({ data: market }, { status: 201 }));
}
