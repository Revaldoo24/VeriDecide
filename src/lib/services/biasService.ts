export type BiasAnalysis = {
  score: number;
  flags: string[];
  signals: Record<string, unknown>;
};

const PROTECTED_TERMS = [
  "race",
  "ethnicity",
  "gender",
  "sex",
  "religion",
  "nationality",
  "disability",
  "age",
  "pregnant",
  "sexual orientation",
  "indigenous",
  "minority",
  "immigrant",
];

const RESTRICTION_TERMS = [
  "deny",
  "refuse",
  "ban",
  "exclude",
  "prohibit",
  "not allowed",
  "ineligible",
  "disqualify",
  "reject",
];

const GENERALIZATION_TERMS = [
  "always",
  "never",
  "all",
  "none",
  "inherently",
  "typically",
  "most",
];

const DECISION_TERMS = [
  "approve",
  "deny",
  "grant",
  "reject",
  "eligible",
  "ineligible",
  "must",
  "shall",
];

export function analyzePromptBias(prompt: string): BiasAnalysis {
  return analyzeBias(prompt, {
    stage: "prompt",
    decisionTerms: [],
  });
}

export function analyzeInferenceBias(output: string): BiasAnalysis {
  return analyzeBias(output, {
    stage: "inference",
    decisionTerms: DECISION_TERMS,
  });
}

function analyzeBias(text: string, options: { stage: string; decisionTerms: string[] }) {
  const lower = text.toLowerCase();
  const protectedHits = PROTECTED_TERMS.filter((term) => lower.includes(term));
  const restrictionHits = RESTRICTION_TERMS.filter((term) => lower.includes(term));
  const generalizationHits = GENERALIZATION_TERMS.filter((term) => lower.includes(term));
  const decisionHits = options.decisionTerms.filter((term) => lower.includes(term));

  const flags = Array.from(new Set([...protectedHits, ...restrictionHits, ...generalizationHits]));

  const biasScore = clamp(
    protectedHits.length * 0.12 +
      restrictionHits.length * 0.2 +
      generalizationHits.length * 0.08 +
      decisionHits.length * 0.1,
  );

  const signals = {
    stage: options.stage,
    protectedHits,
    restrictionHits,
    generalizationHits,
    decisionHits,
  };

  return { score: biasScore, flags, signals };
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}
