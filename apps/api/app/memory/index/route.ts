import { NextRequest, NextResponse } from "next/server";
import { configureMemory, addMemories } from "@repo/ai";
import { putDiscussionMessage, putDiscussionThread, putMemoryPointer, type DiscussionMessage, type DiscussionThread, type MemoryPointer } from "@repo/database";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  return res;
}

export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

// POST /api/memory/index
// body: { type: "comment"|"discussion"|"context", payload, userId, marketId?, threadId?, options? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = typeof body?.type === "string" ? body.type : "comment";
    const userId = typeof body?.userId === "string" ? body.userId : "anonymous";
    const marketId = typeof body?.marketId === "string" ? body.marketId : undefined;
    const threadIdIn = typeof body?.threadId === "string" ? body.threadId : undefined;
    const payload = body?.payload;
    const options = body?.options || {};

    configureMemory({
      apiKey: process.env.MEM0_API_KEY || "",
      host: process.env.MEM0_HOST,
      organizationName: process.env.MEM0_ORGANIZATION_NAME,
      projectName: process.env.MEM0_PROJECT_NAME,
      organizationId: process.env.MEM0_ORGANIZATION_ID,
      projectId: process.env.MEM0_PROJECT_ID,
    });

    // Normalize to messages array for mem0
    const messages: any[] = Array.isArray(payload) ? payload : [{ role: "user", content: JSON.stringify(payload ?? {}) }];

    // Persist discussion scaffolds (optional)
    let threadId = threadIdIn;
    if (!threadId) {
      threadId = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const thread: DiscussionThread = {
        threadId,
        marketId: marketId || "",
        createdBy: userId,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      try {
        await putDiscussionThread(thread);
      } catch (e) {
        console.warn("[api] discussion thread write skipped", e as any);
      }
    }

    const msgId = `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const discMsg: DiscussionMessage = {
      id: msgId,
      threadId: threadId!,
      userId,
      role: "user",
      content: typeof payload === "string" ? payload : JSON.stringify(payload ?? {}),
      createdAt: new Date().toISOString(),
    };
    try {
      await putDiscussionMessage(discMsg);
    } catch (e) {
      console.warn("[api] discussion message write skipped", e as any);
    }

    // Index into mem0 via centralized client
    const addRes = await addMemories(messages, { userId, agentId: "discussion-agent", runId: threadId, enableGraph: !!options?.enableGraph });

    // Store pointer (best-effort)
    const pointer: MemoryPointer = {
      id: `mp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ownerType: "message",
      ownerId: msgId,
      provider: "mem0",
      tags: [type, ...(marketId ? ["market:" + marketId] : [])],
      createdAt: new Date().toISOString(),
      metadata: { addRes },
    };
    try {
      await putMemoryPointer(pointer);
    } catch (e) {
      console.warn("[api] memory pointer write skipped", e as any);
    }

    return withCors(NextResponse.json({ ok: true, threadId, messageId: msgId, pointerId: pointer.id }));
  } catch (e: any) {
    console.error("[api] /memory/index error", e);
    return withCors(NextResponse.json({ error: "server error" }, { status: 500 }));
  }
}
