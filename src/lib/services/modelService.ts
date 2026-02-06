import crypto from "crypto";

export type ModelMetadata = {
  provider: string;
  modelName: string;
  modelVersion: string;
  parameters: Record<string, unknown>;
  requestHash: string;
};

export function buildModelMetadata(input: { system: string; prompt: string }): ModelMetadata {
  const provider = process.env.LLM_PROVIDER || "mock";
  const modelName =
    provider.toLowerCase() === "gemini"
      ? process.env.GEMINI_MODEL || process.env.LLM_MODEL_NAME || "gemini"
      : process.env.LLM_MODEL_NAME || "untrusted-text-generator";
  const modelVersion = process.env.LLM_MODEL_VERSION || "v0";
  const parameters = parseJsonEnv(process.env.LLM_PARAMS) || {
    temperature: process.env.LLM_TEMPERATURE || "0.2",
    maxOutputTokens: process.env.LLM_MAX_TOKENS || "512",
  };

  const requestHash = crypto
    .createHash("sha256")
    .update(`${input.system}\n${input.prompt}`)
    .digest("hex");

  return { provider, modelName, modelVersion, parameters, requestHash };
}

function parseJsonEnv(raw: string | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
