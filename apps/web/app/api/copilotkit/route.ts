import { CopilotRuntime, copilotRuntimeNodeHttpEndpoint, OpenAIAdapter } from "@copilotkit/runtime";
import { OpenAI } from "openai";
const openAIAdapter = new OpenAIAdapter({
    openai: new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" }),
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
});

const runtime = new CopilotRuntime({});

export const POST = copilotRuntimeNodeHttpEndpoint({
  // Some versions expect serviceAdapter and endpoint
  runtime: runtime!,
  serviceAdapter: openAIAdapter,
  endpoint: "/api/copilotkit",
});