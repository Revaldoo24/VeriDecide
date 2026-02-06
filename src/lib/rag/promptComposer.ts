import { EvidenceChunk } from "./retrieval";
import { DetectedLanguage, languageInstruction } from "../services/languageService";

export function composePrompt(query: string, chunks: EvidenceChunk[], lang: DetectedLanguage) {
  const citations = chunks
    .map((chunk, index) => `[S${index + 1}] ${chunk.content}`)
    .join("\n\n");

  const langInstruction = languageInstruction(lang);
  const system = [
    "You are an untrusted text generator.",
    "Only use the provided evidence and cite sources using [S#] tags.",
    "If evidence is insufficient, say so.",
    "Provide a detailed, structured answer. Each paragraph must include citations.",
    langInstruction,
  ].join(" ");

  const prompt = `Question: ${query}\n\nEvidence:\n${citations}\n\nAnswer with citations.`;

  return { system, prompt };
}

export function composeUngovernedPrompt(query: string, lang: DetectedLanguage) {
  const langInstruction = languageInstruction(lang);
  const system = [
    "You are a text generator. Provide a detailed answer.",
    langInstruction,
  ].join(" ");
  const prompt = `Question: ${query}\n\nAnswer clearly and in detail.`;
  return { system, prompt };
}
