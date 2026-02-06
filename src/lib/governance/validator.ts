import { detectLanguage } from "../services/languageService";

export type ValidationIssue = {
  claim: string;
  reason: string;
};

export type ValidationResult = {
  classification: "GROUNDED" | "PARTIALLY_SUPPORTED" | "HALLUCINATED";
  score: number;
  issues: ValidationIssue[];
  claimCount: number;
};

const STOPWORDS = new Set([
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
  "di",
  "ke",
  "para",
  "the",
  "and",
  "or",
  "not",
  "for",
  "with",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "must",
  "should",
  "shall",
]);

const CANON_MAP = new Map<string, string>([
  ["audit", "audit"],
  ["log", "log"],
  ["auditlog", "auditlog"],
  ["retensi", "retention"],
  ["retention", "retention"],
  ["retain", "retention"],
  ["retained", "retention"],
  ["retaining", "retention"],
  ["keputusan", "decision"],
  ["decision", "decision"],
  ["regulasi", "regulation"],
  ["regulation", "regulation"],
  ["regulatory", "regulation"],
  ["lima", "five"],
  ["five", "five"],
  ["tahun", "year"],
  ["year", "year"],
  ["years", "year"],
  ["minimum", "minimum"],
  ["minimal", "minimum"],
  ["organisasi", "organization"],
  ["organization", "organization"],
  ["organisations", "organization"],
  ["bukti", "evidence"],
  ["evidence", "evidence"],
  ["sumber", "source"],
  ["source", "source"],
  ["dokumen", "document"],
  ["document", "document"],
  ["data", "data"],
  ["record", "record"],
  ["records", "record"],
  ["regulated", "regulated"],
  ["undangundang", "law"],
  ["undang-undang", "law"],
  ["law", "law"],
]);

export function validateOutput(output: string, evidenceChunks: string[]): ValidationResult {
  const claims = output
    .split(/[\n\.]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const issues: ValidationIssue[] = [];
  let supported = 0;
  let considered = 0;
  const outputLang = detectLanguage(output);

  for (const claim of claims) {
    const claimTokens = normalizeTokens(claim);
    if (claimTokens.length < 3) {
      continue;
    }

    considered += 1;
    let best = 0;
    let supportedClaim = false;

    for (const chunk of evidenceChunks) {
      const evidenceTokens = normalizeTokens(chunk);
      if (evidenceTokens.length === 0) continue;

      const overlap = overlapRatio(claimTokens, evidenceTokens);
      const chunkLang = detectLanguage(chunk);
      const threshold = overlapThreshold(claimTokens.length, outputLang !== chunkLang);

      if (overlap >= threshold) {
        best = Math.max(best, overlap);
        supportedClaim = true;
        break;
      }

      if (overlap > best) best = overlap;
    }

    if (supportedClaim) {
      supported += 1;
    } else {
      issues.push({ claim, reason: "No sufficient evidence overlap" });
    }
  }

  const score = considered ? supported / considered : 0;
  const classification =
    score >= 0.8
      ? "GROUNDED"
      : score >= 0.4
      ? "PARTIALLY_SUPPORTED"
      : "HALLUCINATED";

  return { classification, score, issues, claimCount: considered };
}

function normalizeTokens(text: string) {
  const stripped = text
    .replace(/\[S\d+\]/gi, " ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!stripped) return [];

  return stripped
    .split(" ")
    .map((token) => token.replace(/-/g, ""))
    .map((token) => singularize(token))
    .filter((token) => token.length > 1)
    .filter((token) => !STOPWORDS.has(token))
    .map((token) => CANON_MAP.get(token) ?? token);
}

function overlapRatio(aTokens: string[], bTokens: string[]) {
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }
  return aSet.size ? intersection / aSet.size : 0;
}

function overlapThreshold(tokenCount: number, languageMismatch: boolean) {
  let threshold = tokenCount <= 6 ? 0.2 : 0.25;
  if (languageMismatch) threshold -= 0.05;
  return Math.max(0.15, threshold);
}

function singularize(token: string) {
  if (token.endsWith("s") && token.length > 3) {
    return token.slice(0, -1);
  }
  return token;
}
