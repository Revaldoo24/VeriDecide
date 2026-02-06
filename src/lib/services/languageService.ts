export type DetectedLanguage = "id" | "en";

const INDONESIAN_TOKENS = [
  "yang",
  "dan",
  "atau",
  "tidak",
  "untuk",
  "dengan",
  "pada",
  "dari",
  "sebagai",
  "adalah",
  "harus",
  "akan",
  "bisa",
  "dapat",
  "kebijakan",
  "aturan",
  "keputusan",
  "peraturan",
  "undang-undang",
];

const ENGLISH_TOKENS = [
  "the",
  "and",
  "or",
  "not",
  "for",
  "with",
  "from",
  "as",
  "is",
  "must",
  "should",
  "policy",
  "rule",
  "decision",
  "regulation",
  "law",
];

export function detectLanguage(text: string): DetectedLanguage {
  const normalized = text.toLowerCase();
  const idScore = INDONESIAN_TOKENS.reduce(
    (score, token) => score + (normalized.includes(token) ? 1 : 0),
    0,
  );
  const enScore = ENGLISH_TOKENS.reduce(
    (score, token) => score + (normalized.includes(token) ? 1 : 0),
    0,
  );

  if (idScore === 0 && enScore === 0) {
    return "id";
  }

  return idScore >= enScore ? "id" : "en";
}

export function languageInstruction(lang: DetectedLanguage) {
  return lang === "id"
    ? "Jawab dalam Bahasa Indonesia."
    : "Answer in English.";
}
