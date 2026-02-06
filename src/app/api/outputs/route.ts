import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, resolveTenantId } from "@/lib/auth/supabaseServer";
import { buildRebuttal } from "@/lib/services/rebuttalService";
import { detectLanguage } from "@/lib/services/languageService";
import { buildGovernedSummary } from "@/lib/services/governedSummaryService";

export async function GET(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req.headers);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("outputs")
      .select(
        "id, prompt_id, status, content, confidence, confidence_internal, confidence_open_source, risk_level, legal_risk, bias_risk, bias_flags, created_at, prompt:prompts(text, title, domain, urgency, tags), validation_results(classification, score, issues), policy_decisions(decision, reasons), reviews(decision, justification, created_at), output_citations(citation_text, chunk_id, similarity, evidence_origin, document_chunks(content, version_id, document_versions(document_id, documents(title, source_uri, source_type))))"
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .order("created_at", { ascending: false, foreignTable: "reviews" })
      .limit(20);

    if (error) {
      throw new Error(error.message);
    }

    const outputs = (data ?? []).map((row) => {
      const validation = Array.isArray(row.validation_results)
        ? row.validation_results[0]
        : row.validation_results;
      const policy = Array.isArray(row.policy_decisions)
        ? row.policy_decisions[0]
        : row.policy_decisions;

      const promptText = row.prompt?.text ?? "";
      const lang = detectLanguage(promptText);

      const citations = Array.isArray(row.output_citations) ? row.output_citations : [];
      const evidenceDocs = new Map<string, { title: string; sourceUri: string | null; sourceType: string }>();
      const evidenceSnippets = citations.map((citation: any) => {
        const doc = citation.document_chunks?.document_versions?.documents;
        if (doc?.title) {
          const key = `${doc.title}::${doc.source_uri ?? ""}`;
          if (!evidenceDocs.has(key)) {
            evidenceDocs.set(key, {
              title: doc.title,
              sourceUri: doc.source_uri ?? null,
              sourceType: doc.source_type ?? "internal",
            });
          }
        }
        return {
          citation: citation.citation_text,
          chunkId: citation.chunk_id,
          snippet: citation.document_chunks?.content?.slice(0, 240) ?? "",
          documentTitle: doc?.title ?? null,
          sourceUri: doc?.source_uri ?? null,
          sourceType: citation.evidence_origin ?? doc?.source_type ?? "internal",
          similarity: citation.similarity ?? null,
        };
      });

      const review = Array.isArray(row.reviews) ? row.reviews[0] : row.reviews;

      const governedSummary = buildGovernedSummary({
        validation: validation?.classification ?? "HALLUCINATED",
        policyDecision: policy?.decision ?? "BLOCK",
        evidenceRatio: validation?.score ?? 0,
      });

      return {
        ...row,
        validation,
        policy,
        review,
        evidence: {
          documents: Array.from(evidenceDocs.values()),
          citations: evidenceSnippets,
        },
        analytics: {
          evidenceRatio: validation?.score ?? null,
          confidence: row.confidence ?? null,
          confidenceInternal: row.confidence_internal ?? null,
          confidenceOpenSource: row.confidence_open_source ?? null,
          sources: evidenceSnippets.map((item: any) => ({
            citation: item.citation,
            similarity: item.similarity ?? null,
            title: item.documentTitle ?? null,
            sourceUri: item.sourceUri ?? null,
            sourceType: item.sourceType ?? "internal",
          })),
        },
        rawOutput: row.content,
        governedOutput:
          (policy?.decision ?? "BLOCK") === "ALLOW"
            ? row.content
            : lang === "id"
            ? "Output ditolak oleh governance karena evidence tidak mencukupi atau melanggar kebijakan."
            : "Output blocked by governance due to insufficient evidence or policy violation.",
        governedSummary,
        rebuttal: buildRebuttal({
          validation: {
            classification: validation?.classification,
            score: validation?.score,
            issues: validation?.issues,
          },
          policy: {
            decision: policy?.decision,
            reasons: policy?.reasons,
          },
          language: lang,
        }),
      };
    });

    return NextResponse.json({ outputs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
