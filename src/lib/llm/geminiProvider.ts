import { LLMClient, LLMGenerateInput, LLMGenerateOutput } from "./llmClient";

export class GeminiClient implements LLMClient {
  constructor(
    private apiKey: string,
    private apiUrl: string,
    private modelName: string,
  ) {}

  async generate(input: LLMGenerateInput): Promise<LLMGenerateOutput> {
    const combinedPrompt = input.system
      ? `${input.system}\n\n${input.prompt}`
      : input.prompt;

    const payload: Record<string, unknown> = {
      contents: [
        {
          role: "user",
          parts: [{ text: combinedPrompt }],
        },
      ],
    };

    const temperature = Number(process.env.LLM_TEMPERATURE ?? "0.2");
    const maxOutputTokens = Number(process.env.LLM_MAX_TOKENS ?? "4096");
    payload.generationConfig = {
      temperature,
      maxOutputTokens,
    };

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${message}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((part: { text?: string }) => part.text ?? "").join("");

    if (!text) {
      throw new Error("Gemini response missing text payload.");
    }

    return { text };
  }
}

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || process.env.LLM_MODEL_NAME || "models/gemini-2.5-flash";
  const normalizedModel = modelName.startsWith("models/") ? modelName : `models/${modelName}`;
  const apiUrl =
    process.env.GEMINI_API_URL ||
    `https://generativelanguage.googleapis.com/v1beta/${normalizedModel}:generateContent`;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  return new GeminiClient(apiKey, apiUrl, normalizedModel);
}
