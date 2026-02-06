export interface LLMGenerateInput {
  system: string;
  prompt: string;
}

export interface LLMGenerateOutput {
  text: string;
}

export interface LLMClient {
  generate(input: LLMGenerateInput): Promise<LLMGenerateOutput>;
}

export class MockLLMClient implements LLMClient {
  async generate(input: LLMGenerateInput): Promise<LLMGenerateOutput> {
    const summary = input.prompt
      .split("Evidence:")[1]
      ?.split("Answer with citations.")[0]
      ?.trim() || "";

    const lines = summary
      .split("\n\n")
      .filter(Boolean)
      .slice(0, 3)
      .map((line, index) => `- ${line.split("\n")[0]} [S${index + 1}]`)
      .join("\n");

    const text = [
      "Draft response based on governed sources:",
      lines || "- No evidence provided [S1]",
      "\nThis is a draft pending human review.",
    ].join("\n");

    return { text };
  }
}
