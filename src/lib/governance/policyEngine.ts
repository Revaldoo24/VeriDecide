import { RiskLevel } from "./riskScoring";

export type PolicyRules = {
  minEvidenceRatio: number;
  minConfidence: number;
  maxRisk: RiskLevel;
  forbidTopics: string[];
};

export const defaultPolicy: PolicyRules = {
  minEvidenceRatio: 0.6,
  minConfidence: 0.55,
  maxRisk: "MEDIUM",
  forbidTopics: ["medical diagnosis", "weapon", "surveillance"],
};

export function normalizePolicy(rules: Partial<PolicyRules> | null | undefined): PolicyRules {
  if (!rules) return defaultPolicy;
  return {
    minEvidenceRatio: rules.minEvidenceRatio ?? defaultPolicy.minEvidenceRatio,
    minConfidence: rules.minConfidence ?? defaultPolicy.minConfidence,
    maxRisk: rules.maxRisk ?? defaultPolicy.maxRisk,
    forbidTopics: rules.forbidTopics ?? defaultPolicy.forbidTopics,
  };
}

export function enforcePolicy(policy: PolicyRules, input: {
  evidenceRatio: number;
  riskLevel: RiskLevel;
  confidence: number;
  outputText: string;
}) {
  const reasons: string[] = [];

  if (input.evidenceRatio < policy.minEvidenceRatio) {
    reasons.push("Insufficient evidence ratio");
  }

  if (input.confidence < policy.minConfidence) {
    reasons.push("Confidence below threshold");
  }

  if (rankRisk(input.riskLevel) > rankRisk(policy.maxRisk)) {
    reasons.push("Risk level exceeds policy");
  }

  const lower = input.outputText.toLowerCase();
  for (const topic of policy.forbidTopics) {
    if (lower.includes(topic.toLowerCase())) {
      reasons.push(`Forbidden topic detected: ${topic}`);
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

function rankRisk(risk: RiskLevel) {
  return risk === "LOW" ? 1 : risk === "MEDIUM" ? 2 : 3;
}
