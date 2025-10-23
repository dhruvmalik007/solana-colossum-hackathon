import { NextRequest, NextResponse } from "next/server";
import { generateText, LanguageModelV1 } from "ai";
import { openai } from "@ai-sdk/openai";

export const dynamic = "force-dynamic";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  return res;
}

export async function OPTIONS() { return withCors(new NextResponse(null, { status: 204 })); }

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return withCors(NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 400 }));
    }
    const body = await req.json();
    const { slug, name, category, latest, change1d, series } = body ?? {};
    const prompt = `You are a research assistant for a prediction market on Solana DeFi protocols.\nReturn STRICT JSON only matching this schema without code fences:\n{\n  "probability_percent": number,\n  "summary": string,\n  "drivers": string[],\n  "risks": string[],\n  "metrics_to_watch": string[],\n  "disclaimer": string\n}\nContext:\n- Market: ${name ?? slug}\n- Category: ${category ?? "Unknown"}\n- Latest TVL (USD): ${Math.round(Number(latest || 0))}\n- 1d change (%): ${typeof change1d === 'number' ? change1d.toFixed(2) : change1d}\n- Series points: ${Array.isArray(series) ? series.length : 0}\nGoal: Provide helpful, neutral, non-financial advice insights strictly in JSON.`;
    const { text } = await generateText({ model: openai("gpt-4o-mini") as unknown as LanguageModelV1, prompt });
    let data: any;
    try { data = JSON.parse(text); } catch { data = { probability_percent: 50, summary: text.trim(), drivers: [], risks: [], metrics_to_watch: [], disclaimer: "AI-generated summary; not financial advice." }; }
    return withCors(NextResponse.json({ data }));
  } catch (e: any) {
    return withCors(NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 }));
  }
}
