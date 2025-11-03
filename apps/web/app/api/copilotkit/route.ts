import { CopilotRuntime, copilotRuntimeNodeHttpEndpoint, OpenAIAdapter } from "@copilotkit/runtime";
import { OpenAI } from "openai";

const openAIAdapter = new OpenAIAdapter({
  // @ts-ignore - OpenAI version mismatch
  openai: new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" }),
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
});

const runtime = new CopilotRuntime({});

const handler = copilotRuntimeNodeHttpEndpoint({
  runtime: runtime!,
  serviceAdapter: openAIAdapter,
  endpoint: "/api/copilotkit",
});

export const POST = async (req: Request) => {
  return handler(req);
};