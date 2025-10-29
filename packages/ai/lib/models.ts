import { createOpenAI } from "@ai-sdk/openai";
import { keys } from "../keys";

const openai = createOpenAI({ apiKey: keys().OPENAI_API_KEY });

/**
 * Exported LLMs used by the package.
 */
type OpenAIModel = ReturnType<typeof openai>;
export type Models = { chat: OpenAIModel; embeddings: OpenAIModel };

export const models: Models = {
  chat: openai("gpt-4o-mini"),
  embeddings: openai("text-embedding-3-small"),
};
