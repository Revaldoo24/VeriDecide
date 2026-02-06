"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OutputOption = {
  id: string;
  status: string;
  content: string;
  confidence: number | string | null;
  confidence_internal?: number | string | null;
  confidence_open_source?: number | string | null;
  risk_level: string | null;
  legal_risk?: string | null;
  bias_risk?: string | null;
  bias_flags?: string[] | null;
  prompt?: { text: string; title?: string | null; domain?: string | null; urgency?: string | null; tags?: string[] } | null;
  validation?: { classification?: string | null; score?: number | string | null; issues?: Array<{ claim: string; reason: string }> };
  policy?: { decision?: string | null; reasons?: string[] | null };
  review?: { decision?: string | null; justification?: string | null; created_at?: string | null };
  evidence?: {
    documents: Array<{ title: string; sourceUri: string | null; sourceType: string }>;
    citations: Array<{ citation: string; snippet: string; documentTitle: string | null; sourceUri: string | null; sourceType: string; similarity?: number | null }>;
  };
  rawOutput?: string;
  governedOutput?: string;
  governedSummary?: { headline: string; notes: string[] };
  analytics?: {
    evidenceRatio?: number | null;
    confidence?: number | string | null;
    confidenceInternal?: number | string | null;
    confidenceOpenSource?: number | string | null;
    sources?: Array<{
      citation: string;
      similarity?: number | null;
      title?: string | null;
      sourceUri?: string | null;
      sourceType?: string | null;
    }>;
  };
  rebuttal?: {
    summary: string;
    issues: string[];
    policyReasons: string[];
    evidenceRatio: number | null;
  };
  created_at: string;
};

export default function ReviewsPage() {
  const [tenantId, setTenantId] = useState("");
  const [outputs, setOutputs] = useState<OutputOption[]>([]);
  const [outputId, setOutputId] = useState("");
  const [decision, setDecision] = useState("APPROVED");
  const [justification, setJustification] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadOutputs = async () => {
    setLoadingOptions(true);
    setError(null);
    try {
      const response = await fetch("/api/outputs", {
        headers: tenantId ? { "x-tenant-id": tenantId } : undefined,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load outputs");
      }
      const options = (data.outputs ?? []) as OutputOption[];
      setOutputs(options);
      if (!outputId && options.length > 0) {
        const pending = options.find((item) => item.status === "PENDING_REVIEW");
        setOutputId(pending?.id ?? options[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOutputs();
  }, []);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantId ? { "x-tenant-id": tenantId } : {}),
        },
        body: JSON.stringify({ outputId, decision, justification }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Review failed");
      }
      setResult("Review recorded and output status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const selectedOutput = outputs.find((output) => output.id === outputId) || null;
  const confidence = selectedOutput?.confidence === null || selectedOutput?.confidence === undefined
    ? null
    : Number(selectedOutput.confidence);
  const confidenceInternal =
    selectedOutput?.confidence_internal === null || selectedOutput?.confidence_internal === undefined
      ? null
      : Number(selectedOutput.confidence_internal);
  const confidenceOpen =
    selectedOutput?.confidence_open_source === null || selectedOutput?.confidence_open_source === undefined
      ? null
      : Number(selectedOutput.confidence_open_source);
  const evidenceRatio =
    selectedOutput?.validation?.score === null || selectedOutput?.validation?.score === undefined
      ? null
      : Number(selectedOutput.validation?.score);
  const biasFlags = selectedOutput?.bias_flags ?? [];

  return (
    <div className="main-shell">
      <div className="mx-auto w-full max-w-6xl">
        <div className="topbar">
          <div>
            <p className="badge">Human Review</p>
            <h1 className="mt-3 text-3xl font-semibold">Approve atau reject output</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Pilih output, baca ringkasan, lalu beri justifikasi untuk keputusan final.
            </p>
          </div>
          <Link className="link" href="/">Back to Overview</Link>
        </div>

        <div className="mt-8 grid-two">
          <div className="card card-animate">
            <div className="card-body">
              <label className="text-sm font-semibold">Tenant ID (optional override)</label>
              <input
                className="input mt-2"
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                placeholder="Leave blank to use DEMO_TENANT_ID"
              />

              <div className="mt-6 flex items-center justify-between gap-3">
                <label className="text-sm font-semibold">Output ID</label>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={loadOutputs}
                  disabled={loadingOptions}
                >
                  {loadingOptions ? "Loading" : "Refresh Outputs"}
                </button>
              </div>
              <select
                className="select mt-2"
                value={outputId}
                onChange={(event) => setOutputId(event.target.value)}
              >
                {outputs.length === 0 && (
                  <option value="">No outputs available</option>
                )}
                {outputs.map((output) => (
                  <option key={output.id} value={output.id}>
                    {output.status} - {new Date(output.created_at).toLocaleString()} - {output.id}
                  </option>
                ))}
              </select>

              <label className="mt-6 text-sm font-semibold">Decision</label>
              <select
                className="select mt-2"
                value={decision}
                onChange={(event) => setDecision(event.target.value)}
              >
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>

              <label className="mt-6 text-sm font-semibold">Justification</label>
              <textarea
                className="textarea mt-2"
                value={justification}
                onChange={(event) => setJustification(event.target.value)}
                placeholder="Tuliskan alasan approval atau rejection"
              />

              <button
                className="button mt-6"
                onClick={submit}
                disabled={loading || !outputId.trim() || !justification.trim()}
              >
                {loading ? "Submitting" : "Submit Review"}
              </button>

              <div className="callout mt-6">
                <p className="text-sm font-semibold">Langkah berikutnya</p>
                <p className="section-subtitle">Setelah review, cek jejak audit di `/audit`.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="card card-animate">
              <div className="card-body">
                <p className="badge">Output Preview</p>
                <h2 className="section-title mt-3">Ringkasan output terpilih</h2>
                {selectedOutput ? (
                  <div className="mt-4 grid gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="pill">{selectedOutput.status}</span>
                      <span className="badge">
                        Legal Risk: {selectedOutput.legal_risk ?? selectedOutput.risk_level ?? "N/A"}
                      </span>
                      <span className="badge">Bias Risk: {selectedOutput.bias_risk ?? "N/A"}</span>
                      <span className="badge">
                        Confidence: {confidence !== null ? confidence.toFixed(2) : "N/A"}
                      </span>
                      {biasFlags.length > 0 && (
                        <span className="badge">Bias Flags: {biasFlags.join(", ")}</span>
                      )}
                    </div>
                    <p className="text-xs text-[color:var(--muted)]">
                      Created: {new Date(selectedOutput.created_at).toLocaleString()}
                    </p>
                    <div className="panel">
                      <p className="panel-title">Validation & Risk</p>
                      <div className="grid-two mt-3">
                        <div>
                          <p className="panel-subtitle">
                            Validation: {selectedOutput.validation?.classification ?? "N/A"}
                          </p>
                          <p className="panel-subtitle">
                            Evidence Ratio: {evidenceRatio !== null ? evidenceRatio.toFixed(2) : "N/A"}
                          </p>
                          <p className="panel-subtitle">
                            Confidence (Internal): {confidenceInternal !== null ? confidenceInternal.toFixed(2) : "N/A"}
                          </p>
                          <p className="panel-subtitle">
                            Confidence (Open-source): {confidenceOpen !== null ? confidenceOpen.toFixed(2) : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="panel-subtitle">
                            Policy Action: {selectedOutput.policy?.decision ?? "N/A"}
                          </p>
                          <p className="panel-subtitle">
                            Review Status: {selectedOutput.review?.decision ?? "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {selectedOutput.prompt && (
                      <div className="panel">
                        <p className="panel-title">Prompt Context</p>
                        {selectedOutput.prompt.title && (
                          <p className="panel-subtitle">Title: {selectedOutput.prompt.title}</p>
                        )}
                        {selectedOutput.prompt.domain && (
                          <p className="panel-subtitle">Domain: {selectedOutput.prompt.domain}</p>
                        )}
                        {selectedOutput.prompt.urgency && (
                          <p className="panel-subtitle">Urgency: {selectedOutput.prompt.urgency}</p>
                        )}
                        {selectedOutput.prompt.tags && selectedOutput.prompt.tags.length > 0 && (
                          <p className="panel-subtitle">Tags: {selectedOutput.prompt.tags.join(", ")}</p>
                        )}
                        <p className="panel-subtitle">{selectedOutput.prompt.text}</p>
                      </div>
                    )}
                    {selectedOutput.evidence && selectedOutput.evidence.documents.length > 0 && (
                      <div className="panel">
                        <p className="panel-title">Retrieved Documents</p>
                        <div className="mt-3 text-xs text-[color:var(--muted)]">
                          {selectedOutput.evidence.documents.map((doc) => (
                            <p key={`${doc.title}-${doc.sourceUri}`}>
                              - {doc.title} ({doc.sourceType})
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedOutput.analytics?.sources && selectedOutput.analytics.sources.length > 0 && (
                      <div className="panel">
                        <p className="panel-title">Evidence Analytics</p>
                        <div className="mt-3 text-xs text-[color:var(--muted)]">
                          {selectedOutput.analytics.sources.map((source) => (
                            <p key={`${source.citation}-${source.title}`}>
                              {source.citation} · {source.title ?? "Untitled"} ·{" "}
                              {source.sourceType ?? "internal"} · Similarity:{" "}
                              {source.similarity !== null && source.similarity !== undefined
                                ? Number(source.similarity).toFixed(2)
                                : "N/A"}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedOutput.rebuttal && (
                      <div className="panel">
                        <p className="panel-title">Sanggahan Governance</p>
                        <p className="panel-subtitle">{selectedOutput.rebuttal.summary}</p>
                        {selectedOutput.rebuttal.issues.length > 0 && (
                          <div className="mt-3 text-xs text-[color:var(--muted)]">
                            {selectedOutput.rebuttal.issues.map((issue) => (
                              <p key={issue}>- {issue}</p>
                            ))}
                          </div>
                        )}
                        {selectedOutput.rebuttal.policyReasons.length > 0 && (
                          <div className="mt-3 text-xs text-[color:var(--muted)]">
                            <p className="font-semibold">Policy reasons:</p>
                            {selectedOutput.rebuttal.policyReasons.map((reason) => (
                              <p key={reason}>- {reason}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {selectedOutput.review?.justification && (
                      <div className="panel">
                        <p className="panel-title">Reviewer Note</p>
                        <p className="panel-subtitle">{selectedOutput.review.justification}</p>
                      </div>
                    )}
                    <div className="panel">
                      <p className="panel-title">Jawaban AI Asli (Raw)</p>
                      <p className="panel-subtitle">{selectedOutput.rawOutput ?? selectedOutput.content}</p>
                    </div>
                    {selectedOutput.governedOutput && (
                      <div className="panel">
                        <p className="panel-title">Output Setelah Governance</p>
                        <p className="panel-subtitle">{selectedOutput.governedOutput}</p>
                      </div>
                    )}
                    {selectedOutput.governedSummary && (
                      <div className="panel">
                        <p className="panel-title">Governance Summary</p>
                        <div className="mt-2 text-xs text-[color:var(--muted)]">
                          {selectedOutput.governedSummary.notes.map((note) => (
                            <p key={note}>- {note}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="section-subtitle mt-4">Pilih output terlebih dahulu.</p>
                )}
              </div>
            </div>

            <div className="card card-animate">
              <div className="card-body grid gap-5">
                <div>
                  <p className="badge">Review Checklist</p>
                  <h2 className="section-title mt-3">Before you approve</h2>
                  <p className="section-subtitle">
                    Pastikan evidence cukup, risk sesuai threshold, dan output tidak bias.
                  </p>
                </div>
                <div>
                  <p className="pill">Evidence coverage meets policy</p>
                </div>
                <div>
                  <p className="pill">Risk level within approved thresholds</p>
                </div>
                <div>
                  <p className="pill">Justification captures intent and scope</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="card mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="card mt-4 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
