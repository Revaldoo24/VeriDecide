export type PromptAnalysisResult = {
  detectedDomain: string;
  keywordHits: string[];
  biasSummary: { flagged: boolean; notes: string[] };
};

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  "Education Policy": ["sekolah", "pendidikan", "bantuan pendidikan", "siswa", "kurikulum"],
  "Legal": ["undang-undang", "peraturan", "regulasi", "pidana", "perdata"],
  "Public Policy": ["kebijakan", "pemerintah", "publik", "program", "subsidi"],
};

export function analyzePrompt(prompt: string, overrideDomain?: string | null): PromptAnalysisResult {
  const normalized = prompt.toLowerCase();
  const hits: string[] = [];
  let detected = "General";
  let bestScore = 0;

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.reduce(
      (count, keyword) => count + (normalized.includes(keyword) ? 1 : 0),
      0,
    );
    if (score > 0) {
      hits.push(...keywords.filter((keyword) => normalized.includes(keyword)));
    }
    if (score > bestScore) {
      bestScore = score;
      detected = domain;
    }
  }

  if (overrideDomain && overrideDomain.trim().length > 0) {
    detected = overrideDomain.trim();
  }

  return {
    detectedDomain: detected,
    keywordHits: Array.from(new Set(hits)),
    biasSummary: {
      flagged: false,
      notes: [],
    },
  };
}
