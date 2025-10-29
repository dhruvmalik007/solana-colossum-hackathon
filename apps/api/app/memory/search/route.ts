import { NextRequest, NextResponse } from "next/server";
import { configureMemory, searchMemories } from "@repo/ai";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  return res;
}

export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

// GET /api/memory/search?q=...&limit=5&rerank=0|1&enableGraph=0|1&userId=&agentId=&runId=

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    if (!q) return withCors(NextResponse.json({ error: "q required" }, { status: 400 }));
    const limit = Number(url.searchParams.get("limit") || 5);
    const rerank = url.searchParams.get("rerank") === "1";
    const enableGraph = url.searchParams.get("enableGraph") === "1";
    const userId = url.searchParams.get("userId") || undefined;
    const agentId = url.searchParams.get("agentId") || undefined;
    const runId = url.searchParams.get("runId") || undefined;

    configureMemory({
      apiKey: process.env.MEM0_API_KEY || "",
      host: process.env.MEM0_HOST,
      organizationName: process.env.MEM0_ORGANIZATION_NAME,
      projectName: process.env.MEM0_PROJECT_NAME,
      organizationId: process.env.MEM0_ORGANIZATION_ID,
      projectId: process.env.MEM0_PROJECT_ID,
    });

    const results = await searchMemories(q, { userId, agentId, runId, rerank, enableGraph, limit });
    return withCors(NextResponse.json({ data: results ?? [] }));
  } catch (e) {
    console.error("[api] /memory/search error", e);
    return withCors(NextResponse.json({ error: "server error" }, { status: 500 }));
  }
}
