export type GovernedSummary = {
  headline: string;
  notes: string[];
};

export function buildGovernedSummary(params: {
  validation: "GROUNDED" | "PARTIALLY_SUPPORTED" | "HALLUCINATED";
  policyDecision: "ALLOW" | "BLOCK";
  evidenceRatio: number;
}) {
  const notes: string[] = [];

  if (params.validation === "GROUNDED") {
    notes.push("Output didukung evidence yang cukup.");
  } else if (params.validation === "PARTIALLY_SUPPORTED") {
    notes.push("Sebagian klaim tidak didukung evidence.");
  } else {
    notes.push("Output tidak didukung evidence yang cukup.");
  }

  if (params.policyDecision === "BLOCK") {
    notes.push("Diblokir oleh policy governance.");
  } else {
    notes.push("Lanjut ke human review.");
  }

  return {
    headline: "Validated AI (Governed)",
    notes,
  } as GovernedSummary;
}
