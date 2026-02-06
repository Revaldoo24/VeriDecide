import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, resolveTenantId } from "@/lib/auth/supabaseServer";
import { embedTextLocal } from "@/lib/rag/embedding";
import { retrieveEvidence } from "@/lib/rag/retrieval";
import { composePrompt, composeUngovernedPrompt } from "@/lib/rag/promptComposer";
import { getLLMClient } from "@/lib/llm";
import { validateOutput } from "@/lib/governance/validator";
import { scoreRiskAndBias } from "@/lib/governance/riskScoring";
import { enforcePolicy, normalizePolicy } from "@/lib/governance/policyEngine";
import { appendAudit } from "@/lib/audit/ledger";
import { analyzeInferenceBias, analyzePromptBias } from "@/lib/services/biasService";
import { buildModelMetadata } from "@/lib/services/modelService";
import { addTraceStep, TraceStep } from "@/lib/services/traceService";
import { buildRebuttal } from "@/lib/services/rebuttalService";
import { detectLanguage } from "@/lib/services/languageService";
import { ingestOpenSourceEvidence } from "@/lib/services/openSourceIngestService";
import { analyzePrompt } from "@/lib/services/promptAnalysisService";
import { buildGovernedSummary } from "@/lib/services/governedSummaryService";

export async function POST(req: NextRequest) {
  try {
    console.info("[pipeline] request received");
    const body = await req.json();
    const promptText = String(body?.prompt || "").trim();
    const allowUngoverned = Boolean(body?.allowUngoverned);
    const promptTitle = String(body?.title || "").trim();
    const promptDomain = String(body?.domain || "").trim();
    const promptUrgency = String(body?.urgency || "").trim();
    const promptTags = Array.isArray(body?.tags)
      ? body.tags
      : String(body?.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
    const allowOpenSource = Boolean(body?.allowOpenSource);
    const openSourceQuery = String(body?.openSourceQuery || promptText).trim();
    if (!promptText) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const tenantId = resolveTenantId(req.headers);
    const actorId = body?.actorId ?? req.headers.get("x-actor-id") ?? null;
    const supabase = getSupabaseAdmin();
    const traceSteps: TraceStep[] = [];
    console.info("[pipeline] tenant", tenantId, "actor", actorId);

    const { data: promptRow, error: promptError } = await supabase
      .from("prompts")
      .insert({
        tenant_id: tenantId,
        author_id: actorId,
        text: promptText,
        status: "SUBMITTED",
        title: promptTitle || null,
        domain: promptDomain || null,
        urgency: promptUrgency || null,
        tags: promptTags,
      })
      .select("id")
      .single();

    if (promptError || !promptRow) {
      throw new Error(promptError?.message || "Failed to create prompt.");
    }
    console.info("[pipeline] prompt created", promptRow.id);

    await appendAudit({
      tenantId,
      actorId,
      action: "PROMPT_SUBMITTED",
      entityType: "prompt",
      entityId: promptRow.id,
      payload: { prompt: promptText },
    });

    addTraceStep(traceSteps, "prompt_received", { promptLength: promptText.length }, { promptId: promptRow.id });

    const promptAnalysis = analyzePrompt(promptText, promptDomain || null);
    console.info("[pipeline] prompt analysis", promptAnalysis.detectedDomain, promptAnalysis.keywordHits);
    await supabase.from("prompt_analysis").insert({
      tenant_id: tenantId,
      prompt_id: promptRow.id,
      detected_domain: promptAnalysis.detectedDomain,
      keyword_hits: promptAnalysis.keywordHits,
      bias_summary: promptAnalysis.biasSummary,
    });

    const promptBias = analyzePromptBias(promptText);
    console.info("[pipeline] prompt bias score", promptBias.score, "flags", promptBias.flags);
    await supabase.from("prompt_bias_analysis").insert({
      tenant_id: tenantId,
      prompt_id: promptRow.id,
      bias_score: promptBias.score,
      bias_flags: promptBias.flags,
      signals: promptBias.signals,
    });

    await appendAudit({
      tenantId,
      actorId,
      action: "PROMPT_BIAS_ANALYZED",
      entityType: "prompt_bias",
      entityId: promptRow.id,
      payload: { score: promptBias.score, flags: promptBias.flags },
    });

    await appendAudit({
      tenantId,
      actorId,
      action: "PROMPT_ANALYZED",
      entityType: "prompt_analysis",
      entityId: promptRow.id,
      payload: promptAnalysis,
    });

    addTraceStep(
      traceSteps,
      "prompt_bias_analysis",
      { flags: promptBias.flags.length },
      { score: promptBias.score },
    );

    const detectedLanguage = detectLanguage(promptText);
    console.info("[pipeline] detected language", detectedLanguage);
    let openSourceReport = null;

    if (allowOpenSource) {
      console.info("[pipeline] open-source ingest enabled", openSourceQuery || promptText);
      openSourceReport = await ingestOpenSourceEvidence({
        tenantId,
        query: openSourceQuery || promptText,
        maxResults: Number(process.env.OPEN_SOURCE_MAX_RESULTS || "6"),
      });
      console.info("[pipeline] open-source ingest report", openSourceReport);

      await appendAudit({
        tenantId,
        actorId,
        action: "OPEN_SOURCE_INGESTED",
        entityType: "open_source",
        entityId: promptRow.id,
        payload: openSourceReport,
      });
    }
    const queryEmbedding = embedTextLocal(promptText);
    const evidence = await retrieveEvidence({ tenantId, queryEmbedding, matchCount: 6 });
    console.info("[pipeline] evidence retrieved", evidence.length);

    const evidenceIds = evidence.map((chunk) => chunk.id);
    const { data: chunkMeta } = await supabase
      .from("document_chunks")
      .select("id, document_versions(document_id, documents(source_type, title, source_uri))")
      .in("id", evidenceIds);
    const chunkMetaMap = new Map<string, any>();
    for (const item of chunkMeta ?? []) {
      chunkMetaMap.set(item.id, item);
    }

    const { data: ragRow, error: ragError } = await supabase
      .from("rag_sessions")
      .insert({
        tenant_id: tenantId,
        prompt_id: promptRow.id,
        retrieved_chunk_ids: evidence.map((chunk) => chunk.id),
        retrieval_metadata: {
          matchCount: evidence.length,
          topSimilarity: evidence[0]?.similarity ?? 0,
        },
      })
      .select("id")
      .single();

    if (ragError || !ragRow) {
      throw new Error(ragError?.message || "Failed to create RAG session.");
    }
    console.info("[pipeline] rag session", ragRow.id);

    await appendAudit({
      tenantId,
      actorId,
      action: "RAG_RETRIEVED",
      entityType: "rag_session",
      entityId: ragRow.id,
      payload: { chunks: evidence.map((chunk) => chunk.id) },
    });

    addTraceStep(
      traceSteps,
      "rag_retrieval",
      { queryLength: promptText.length },
      { chunks: evidence.length, topSimilarity: evidence[0]?.similarity ?? 0 },
    );

    const { system, prompt } = allowUngoverned
      ? composeUngovernedPrompt(promptText, detectedLanguage)
      : composePrompt(promptText, evidence, detectedLanguage);
    const llm = getLLMClient();
    const modelMetadata = buildModelMetadata({ system, prompt });
    const llmOutput = await llm.generate({ system, prompt });
    const ungovernedOutput = allowUngoverned ? llmOutput.text : null;
    console.info("[pipeline] llm output length", llmOutput.text.length);

    const { data: outputRow, error: outputError } = await supabase
      .from("outputs")
      .insert({
        tenant_id: tenantId,
        prompt_id: promptRow.id,
        status: "DRAFT",
        content: llmOutput.text,
      })
      .select("id")
      .single();

    if (outputError || !outputRow) {
      throw new Error(outputError?.message || "Failed to create output.");
    }
    console.info("[pipeline] output stored", outputRow.id);

    await appendAudit({
      tenantId,
      actorId,
      action: "OUTPUT_GENERATED",
      entityType: "output",
      entityId: outputRow.id,
      payload: { length: llmOutput.text.length },
    });

    await supabase.from("model_invocations").insert({
      tenant_id: tenantId,
      output_id: outputRow.id,
      provider: modelMetadata.provider,
      model_name: modelMetadata.modelName,
      model_version: modelMetadata.modelVersion,
      parameters: modelMetadata.parameters,
      request_hash: modelMetadata.requestHash,
    });

    addTraceStep(
      traceSteps,
      "llm_generation",
      { provider: modelMetadata.provider, model: modelMetadata.modelName },
      { outputLength: llmOutput.text.length },
    );

    let analyticsSources: Array<{
      citation: string;
      chunkId: string;
      similarity: number;
      sourceType: string;
      title: string | null;
      sourceUri: string | null;
    }> = [];

    if (evidence.length) {
      const citations = evidence.map((chunk, index) => {
        const docMeta = chunkMetaMap.get(chunk.id)?.document_versions?.documents;
        const sourceType = docMeta?.source_type ?? "internal";
        const citation = `[S${index + 1}]`;
        analyticsSources.push({
          citation,
          chunkId: chunk.id,
          similarity: chunk.similarity ?? 0,
          sourceType,
          title: docMeta?.title ?? null,
          sourceUri: docMeta?.source_uri ?? null,
        });
        return {
          tenant_id: tenantId,
          output_id: outputRow.id,
          chunk_id: chunk.id,
          citation_text: citation,
          evidence_origin: sourceType,
          similarity: chunk.similarity ?? null,
        };
      });
      await supabase.from("output_citations").insert(citations);
      console.info("[pipeline] citations stored", citations.length);
    }

    const inferenceBias = analyzeInferenceBias(llmOutput.text);
    console.info("[pipeline] inference bias score", inferenceBias.score, "flags", inferenceBias.flags);
    await supabase.from("inference_bias_analysis").insert({
      tenant_id: tenantId,
      output_id: outputRow.id,
      bias_score: inferenceBias.score,
      bias_flags: inferenceBias.flags,
      signals: inferenceBias.signals,
    });

    addTraceStep(
      traceSteps,
      "inference_bias_analysis",
      { flags: inferenceBias.flags.length },
      { score: inferenceBias.score },
    );

    const validation = allowUngoverned
      ? validateOutput(llmOutput.text, evidence.map((chunk) => chunk.content))
      : validateOutput(llmOutput.text, evidence.map((chunk) => chunk.content));
    console.info("[pipeline] validation", validation.classification, validation.score);

    await supabase.from("validation_results").insert({
      tenant_id: tenantId,
      output_id: outputRow.id,
      classification: validation.classification,
      issues: validation.issues,
      score: validation.score,
    });

    await appendAudit({
      tenantId,
      actorId,
      action: "OUTPUT_VALIDATED",
      entityType: "validation",
      entityId: outputRow.id,
      payload: { classification: validation.classification, score: validation.score },
    });

    addTraceStep(
      traceSteps,
      "validation",
      { claimCount: validation.claimCount },
      { classification: validation.classification, score: validation.score },
    );

    const combinedBiasScore = Math.max(promptBias.score, inferenceBias.score);

    const sourceStats = evidence.reduce(
      (acc, chunk) => {
        const sourceType =
          chunkMetaMap.get(chunk.id)?.document_versions?.documents?.source_type ?? "internal";
        if (sourceType === "open_source") {
          acc.openSource.total += chunk.similarity;
          acc.openSource.count += 1;
        } else {
          acc.internal.total += chunk.similarity;
          acc.internal.count += 1;
        }
        return acc;
      },
      {
        internal: { total: 0, count: 0 },
        openSource: { total: 0, count: 0 },
      },
    );

    const confidenceInternal =
      sourceStats.internal.count > 0 ? sourceStats.internal.total / sourceStats.internal.count : null;
    const confidenceOpenSource =
      sourceStats.openSource.count > 0 ? sourceStats.openSource.total / sourceStats.openSource.count : null;
    const scores = scoreRiskAndBias({
      output: llmOutput.text,
      evidenceRatio: validation.score,
      claimCount: validation.claimCount,
      issueCount: validation.issues.length,
      biasScore: combinedBiasScore,
    });
    console.info("[pipeline] risk/confidence", scores.risk, scores.confidence, scores.biasRisk);

    const combinedBiasFlags = Array.from(
      new Set([...scores.biasFlags, ...promptBias.flags, ...inferenceBias.flags]),
    );

    await supabase
      .from("outputs")
      .update({
        confidence: scores.confidence,
        risk_level: scores.risk,
        bias_flags: combinedBiasFlags,
        legal_risk: scores.risk,
        bias_risk: scores.biasRisk,
        confidence_internal: confidenceInternal,
        confidence_open_source: confidenceOpenSource,
      })
      .eq("id", outputRow.id);

    const { data: policyRow } = await supabase
      .from("policies")
      .select("id, rules")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const policy = normalizePolicy(policyRow?.rules as Record<string, unknown> | undefined);
    const policyDecision = enforcePolicy(policy, {
      evidenceRatio: validation.score,
      riskLevel: scores.risk,
      confidence: scores.confidence,
      outputText: llmOutput.text,
    });
    console.info("[pipeline] policy decision", policyDecision.allowed, policyDecision.reasons);

    const finalStatus = policyDecision.allowed ? "PENDING_REVIEW" : "REJECTED";

    await supabase.from("outputs").update({ status: finalStatus }).eq("id", outputRow.id);

    await supabase.from("policy_decisions").insert({
      tenant_id: tenantId,
      output_id: outputRow.id,
      policy_id: policyRow?.id ?? null,
      decision: policyDecision.allowed ? "ALLOW" : "BLOCK",
      reasons: policyDecision.reasons,
    });

    await appendAudit({
      tenantId,
      actorId,
      action: "POLICY_ENFORCED",
      entityType: "policy_decision",
      entityId: outputRow.id,
      payload: { allowed: policyDecision.allowed, reasons: policyDecision.reasons },
    });

    addTraceStep(
      traceSteps,
      "policy_enforcement",
      { policyId: policyRow?.id ?? null },
      { allowed: policyDecision.allowed, reasons: policyDecision.reasons },
    );

    await supabase.from("reasoning_traces").insert({
      tenant_id: tenantId,
      output_id: outputRow.id,
      steps: traceSteps,
    });

    const rebuttal = buildRebuttal({
      validation: {
        classification: validation.classification,
        score: validation.score,
        issues: validation.issues,
      },
      policy: {
        decision: policyDecision.allowed ? "ALLOW" : "BLOCK",
        reasons: policyDecision.reasons,
      },
      language: detectedLanguage,
    });

    const governedSummary = buildGovernedSummary({
      validation: validation.classification,
      policyDecision: policyDecision.allowed ? "ALLOW" : "BLOCK",
      evidenceRatio: validation.score,
    });

    const governedOutput = policyDecision.allowed
      ? llmOutput.text
      : detectedLanguage === "id"
      ? "Output ditolak oleh governance karena evidence tidak mencukupi atau melanggar kebijakan."
      : "Output blocked by governance due to insufficient evidence or policy violation.";

    return NextResponse.json({
      promptId: promptRow.id,
      outputId: outputRow.id,
      status: finalStatus,
      output: llmOutput.text,
      rawOutput: llmOutput.text,
      ungovernedOutput,
      governedOutput,
      governedSummary,
      rebuttal,
      openSourceIngest: openSourceReport,
      validation: validation.classification,
      confidence: scores.confidence,
      risk: scores.risk,
      legalRisk: scores.risk,
      biasRisk: scores.biasRisk,
      biasFlags: combinedBiasFlags,
      confidenceBySource: {
        internal: confidenceInternal,
        openSource: confidenceOpenSource,
      },
      analytics: {
        evidenceRatio: validation.score,
        confidence: scores.confidence,
        confidenceInternal,
        confidenceOpenSource,
        sources: analyticsSources,
      },
      biasScores: {
        prompt: promptBias.score,
        inference: inferenceBias.score,
      },
      model: {
        provider: modelMetadata.provider,
        modelName: modelMetadata.modelName,
        modelVersion: modelMetadata.modelVersion,
        requestHash: modelMetadata.requestHash,
      },
      prompt: {
        title: promptTitle,
        domain: promptAnalysis.detectedDomain,
        urgency: promptUrgency || null,
        tags: promptTags,
        keywordHits: promptAnalysis.keywordHits,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
