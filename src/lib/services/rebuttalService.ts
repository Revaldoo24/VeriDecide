export type ValidationSummary = {
  classification?: string | null;
  score?: number | null;
  issues?: Array<{ claim: string; reason: string }> | null;
};

export type PolicySummary = {
  decision?: string | null;
  reasons?: string[] | null;
};

export type Rebuttal = {
  summary: string;
  issues: string[];
  policyReasons: string[];
  evidenceRatio: number | null;
};

export function buildRebuttal(params: {
  validation: ValidationSummary;
  policy: PolicySummary;
  language?: "id" | "en";
}): Rebuttal {
  const lang = params.language ?? "id";
  const issues = (params.validation.issues ?? [])
    .slice(0, 3)
    .map((issue) => `"${issue.claim}" → ${translateReason(issue.reason, lang)}`);

  const policyReasons = (params.policy.reasons ?? []).map((reason) =>
    translatePolicyReason(reason, lang),
  );

  const summaryParts: string[] = [];
  const classification = params.validation.classification ?? "UNKNOWN";

  if (classification === "HALLUCINATED") {
    summaryParts.push(
      lang === "id"
        ? "Output tidak didukung evidence yang cukup."
        : "The output is not supported by sufficient evidence.",
    );
  } else if (classification === "PARTIALLY_SUPPORTED") {
    summaryParts.push(
      lang === "id"
        ? "Sebagian klaim tidak didukung evidence."
        : "Some claims are not supported by evidence.",
    );
  } else if (classification === "GROUNDED") {
    summaryParts.push(
      lang === "id"
        ? "Output didukung evidence, lanjut review manusia."
        : "The output is supported by evidence and can proceed to human review.",
    );
  } else {
    summaryParts.push(lang === "id" ? "Validasi belum tersedia." : "Validation is unavailable.");
  }

  if (params.policy.decision === "BLOCK") {
    summaryParts.push(
      lang === "id" ? "Diblokir oleh policy governance." : "Blocked by policy governance.",
    );
  }

  const evidenceRatio =
    typeof params.validation.score === "number" ? params.validation.score : null;

  return {
    summary: summaryParts.join(" "),
    issues,
    policyReasons,
    evidenceRatio,
  };
}

function translateReason(reason: string, lang: "id" | "en") {
  if (lang === "en") return reason;
  if (reason === "No sufficient evidence overlap") {
    return "Tidak ada kecocokan evidence yang cukup";
  }
  return reason;
}

function translatePolicyReason(reason: string, lang: "id" | "en") {
  if (lang === "en") return reason;
  if (reason.startsWith("Forbidden topic detected:")) {
    const topic = reason.replace("Forbidden topic detected:", "").trim();
    return `Topik terlarang terdeteksi: ${topic}`;
  }
  const map: Record<string, string> = {
    "Insufficient evidence ratio": "Rasio evidence tidak mencukupi",
    "Confidence below threshold": "Confidence di bawah threshold",
    "Risk level exceeds policy": "Level risiko melebihi batas kebijakan",
  };
  return map[reason] ?? reason;
}
