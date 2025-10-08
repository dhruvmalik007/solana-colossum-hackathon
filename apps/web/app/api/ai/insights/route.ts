import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 400 });
    }

    const body = await req.json();
    const { slug, name, category, latest, change1d, series } = body ?? {};

    const prompt = `You are a research assistant for a prediction market on Solana DeFi protocols.
Return STRICT JSON only matching this schema without code fences:
{
  "probability_percent": number, // 0-100 estimated short-term success likelihood
  "summary": string,             // 2-3 concise sentences
  "drivers": string[],           // 3 bullet drivers
  "risks": string[],             // 2 bullet risks
  "metrics_to_watch": string[],  // 3 KPIs
  "disclaimer": string           // single sentence disclaimer
}
Context:
- Market: ${name ?? slug}
- Category: ${category ?? "Unknown"}
- Latest TVL (USD): ${Math.round(Number(latest || 0))}
- 1d change (%): ${typeof change1d === 'number' ? change1d.toFixed(2) : change1d}
- Series points: ${Array.isArray(series) ? series.length : 0}
Goal: Provide helpful, neutral, non-financial advice insights strictly in JSON.`;

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    });

    // Attempt to parse strict JSON; if parsing fails, wrap as summary only
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        probability_percent: 50,
        summary: text.trim(),
        drivers: [],
        risks: [],
        metrics_to_watch: [],
        disclaimer: "AI-generated summary; not financial advice.",
      };
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
  }
}
