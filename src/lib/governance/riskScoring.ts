export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export function scoreRiskAndBias(params: {
  output: string;
  evidenceRatio: number;
  claimCount: number;
  issueCount: number;
  biasScore?: number;
}) {
  const lower = params.output.toLowerCase();
  const biasTerms = ["race", "gender", "religion", "ethnicity", "nationality", "disability"];
  const biasFlags = biasTerms.filter((term) => lower.includes(term));

  let risk: RiskLevel = "LOW";
  if (lower.includes("penalty") || lower.includes("sanction") || lower.includes("criminal")) {
    risk = "HIGH";
  } else if (lower.includes("must") || lower.includes("shall") || lower.includes("non-compliance")) {
    risk = "MEDIUM";
  }

  const evidenceScore = Math.min(1, Math.max(0, params.evidenceRatio));
  const issuePenalty = params.claimCount
    ? Math.max(0, 1 - params.issueCount / params.claimCount)
    : 0;

  const confidence = Math.min(1, Math.max(0, evidenceScore * 0.7 + issuePenalty * 0.3));

  const biasRisk = scoreBiasRisk(params.biasScore ?? 0);

  return { risk, biasFlags, confidence, biasRisk };
}

function scoreBiasRisk(score: number) {
  if (score >= 0.5) return "HIGH";
  if (score >= 0.25) return "MEDIUM";
  return "LOW";
}
