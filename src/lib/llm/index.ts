import { LLMClient, MockLLMClient } from "./llmClient";
import { getGeminiClient } from "./geminiProvider";

export function getLLMClient(): LLMClient {
  const provider = process.env.LLM_PROVIDER || "mock";
  if (provider.toLowerCase() === "gemini") {
    return getGeminiClient();
  }
  return new MockLLMClient();
}
