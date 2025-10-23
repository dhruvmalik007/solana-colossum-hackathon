import { NextRequest, NextResponse } from "next/server";
import { Embed, listEmbedsByMarket, putEmbed } from "@repo/database";

function detectSource(url: string): string {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    if (h.includes("twitter.com") || h.includes("x.com")) return "x";
    if (h.includes("bsky.app") || h.includes("bluesky")) return "bluesky";
    if (h.includes("instagram.com")) return "instagram";
    return "link";
  } catch {
    return "link";
  }
}

function sanitizeHtml(html: string): string {
  // Minimal sanitize: strip <script> tags and inline event handlers
  let out = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/ on[a-z]+="[^"]*"/gi, "");
  out = out.replace(/ on[a-z]+='[^']*'/gi, "");
  return out;
}

async function tryResolveOEmbed(url: string, source: string): Promise<string | undefined> {
  try {
    if (source === "x") {
      const r = await fetch(`https://publish.twitter.com/oembed?omit_script=1&url=${encodeURIComponent(url)}`, { next: { revalidate: 0 } });
      if (r.ok) {
        const j = await r.json();
        if (typeof j?.html === "string") return sanitizeHtml(j.html);
      }
    } else if (source === "bluesky") {
      const r = await fetch(`https://embed.bsky.app/oembed?url=${encodeURIComponent(url)}`, { next: { revalidate: 0 } });
      if (r.ok) {
        const j = await r.json();
        if (typeof j?.html === "string") return sanitizeHtml(j.html);
      }
    } else if (source === "instagram") {
      // Instagram oEmbed often requires token; try without, else fallback
      const r = await fetch(`https://graph.facebook.com/v10.0/instagram_oembed?omitscript=true&url=${encodeURIComponent(url)}`, { next: { revalidate: 0 } });
      if (r.ok) {
        const j = await r.json();
        if (typeof j?.html === "string") return sanitizeHtml(j.html);
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const marketId = url.searchParams.get("marketId");
    if (!marketId) return NextResponse.json({ error: "marketId required" }, { status: 400 });
    const data = await listEmbedsByMarket(marketId);
    return NextResponse.json({ data });
  } catch (e) {
    console.error("/api/embeds GET error", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const marketId = typeof body?.marketId === "string" ? body.marketId : "";
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!marketId || !url) return NextResponse.json({ error: "marketId and url required" }, { status: 400 });
    const source = detectSource(url);
    const id = (global as any).crypto?.randomUUID?.() || `e_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const createdAt = new Date().toISOString();
    const html = await tryResolveOEmbed(url, source);
    const embed: Embed = { id, marketId, url, source, html, createdAt };
    await putEmbed(embed);
    return NextResponse.json({ data: embed }, { status: 201 });
  } catch (e) {
    console.error("/api/embeds POST error", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
