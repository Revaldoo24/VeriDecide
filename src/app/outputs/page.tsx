"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OutputRow = {
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

export default function OutputsPage() {
  const [tenantId, setTenantId] = useState("");
  const [outputs, setOutputs] = useState<OutputRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadOutputs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/outputs", {
        headers: tenantId ? { "x-tenant-id": tenantId } : undefined,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch outputs");
      }
      setOutputs(data.outputs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutputs();
  }, []);

  return (
    <div className="main-shell">
      <div className="mx-auto w-full max-w-6xl">
        <div className="topbar">
          <div>
            <p className="badge">Output Review</p>
            <h1 className="mt-3 text-3xl font-semibold">Tinjau output dan status governance</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Di sini kamu mengecek groundedness, risk, dan confidence sebelum review manusia.
            </p>
          </div>
          <Link className="link" href="/">Back to Overview</Link>
        </div>

        <div className="mt-8 grid-two">
          <div className="card card-animate">
            <div className="card-body">
              <p className="badge">Apa yang harus dilakukan</p>
              <h2 className="section-title mt-3">Validasi sebelum approval</h2>
              <div className="flow mt-4">
                <div className="flow-step">
                  <div className="flow-index">1</div>
                  <div className="flow-body">
                    <h4>Pilih output terbaru</h4>
                    <p className="section-subtitle">Pastikan statusnya PENDING_REVIEW.</p>
                  </div>
                </div>
                <div className="flow-step">
                  <div className="flow-index">2</div>
                  <div className="flow-body">
                    <h4>Periksa risk & confidence</h4>
                    <p className="section-subtitle">Jika risk tinggi atau confidence rendah, tolak.</p>
                  </div>
                </div>
                <div className="flow-step">
                  <div className="flow-index">3</div>
                  <div className="flow-body">
                    <h4>Masuk ke Review</h4>
                    <p className="section-subtitle">Lanjut ke `/reviews` untuk approval final.</p>
                  </div>
                </div>
              </div>
              <div className="callout mt-5">
                <p className="text-sm font-semibold">Langkah berikutnya</p>
                <p className="section-subtitle">Gunakan Output ID untuk approval di halaman Reviews.</p>
              </div>
            </div>
          </div>

          <div className="card card-animate">
            <div className="card-body grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-semibold">Tenant ID (optional override)</label>
                <input
                  className="input mt-2"
                  placeholder="Optional tenant override"
                  value={tenantId}
                  onChange={(event) => setTenantId(event.target.value)}
                />
              </div>
              <div className="stat">
                <span className="stat-label">Outputs Loaded</span>
                <span className="stat-value">{outputs.length}</span>
              </div>
              <div className="flex items-end">
                <button
                  className="button"
                  onClick={loadOutputs}
                  disabled={loading}
                >
                  {loading ? "Refreshing" : "Refresh Queue"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="card mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-5">
          {outputs.map((output) => {
            const confidence =
              output.confidence === null ? null : Number(output.confidence);
            const confidenceInternal =
              output.confidence_internal === null || output.confidence_internal === undefined
                ? null
                : Number(output.confidence_internal);
            const confidenceOpen =
              output.confidence_open_source === null || output.confidence_open_source === undefined
                ? null
                : Number(output.confidence_open_source);
            const biasFlags = output.bias_flags ?? [];
            const evidenceRatio =
              output.validation?.score === null || output.validation?.score === undefined
                ? null
                : Number(output.validation?.score);
            return (
              <div key={output.id} className="card">
                <div className="card-body grid gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill">{output.status}</span>
                    <span className="badge">Legal Risk: {output.legal_risk ?? output.risk_level ?? "N/A"}</span>
                    <span className="badge">Bias Risk: {output.bias_risk ?? "N/A"}</span>
                    <span className="badge">
                      Confidence: {confidence !== null ? confidence.toFixed(2) : "N/A"}
                    </span>
                    {biasFlags.length > 0 && (
                      <span className="badge">Bias: {biasFlags.join(", ")}</span>
                    )}
                    <span className="text-xs text-[color:var(--muted)]">
                      {new Date(output.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="panel">
                    <p className="panel-title">Validation & Risk</p>
                    <div className="grid-two mt-3">
                      <div>
                        <p className="panel-subtitle">
                          Validation: {output.validation?.classification ?? "N/A"}
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
                          Policy Action: {output.policy?.decision ?? "N/A"}
                        </p>
                        <p className="panel-subtitle">
                          Review: {output.review?.decision ?? "Pending"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="panel">
                    <p className="panel-title">Jawaban AI Asli (Raw)</p>
                    <p className="panel-subtitle">{output.rawOutput ?? output.content}</p>
                  </div>
                  {output.governedOutput && (
                    <div className="panel">
                      <p className="panel-title">Output Setelah Governance</p>
                      <p className="panel-subtitle">{output.governedOutput}</p>
                    </div>
                  )}
                  {output.analytics && output.analytics.sources && output.analytics.sources.length > 0 && (
                    <div className="panel">
                      <p className="panel-title">Evidence Analytics</p>
                      <div className="mt-3 text-xs text-[color:var(--muted)]">
                        {output.analytics.sources.map((source) => (
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
                  {output.governedSummary && (
                    <div className="panel">
                      <p className="panel-title">Governance Summary</p>
                      <div className="mt-2 text-xs text-[color:var(--muted)]">
                        {output.governedSummary.notes.map((note) => (
                          <p key={note}>- {note}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {output.prompt && (
                    <div className="panel">
                      <p className="panel-title">Prompt Context</p>
                      {output.prompt.title && (
                        <p className="panel-subtitle">Title: {output.prompt.title}</p>
                      )}
                      {output.prompt.domain && (
                        <p className="panel-subtitle">Domain: {output.prompt.domain}</p>
                      )}
                      {output.prompt.urgency && (
                        <p className="panel-subtitle">Urgency: {output.prompt.urgency}</p>
                      )}
                      {output.prompt.tags && output.prompt.tags.length > 0 && (
                        <p className="panel-subtitle">Tags: {output.prompt.tags.join(", ")}</p>
                      )}
                      <p className="panel-subtitle">{output.prompt.text}</p>
                    </div>
                  )}
                  {output.rebuttal && (
                    <div className="panel">
                      <p className="panel-title">Sanggahan Governance</p>
                      <p className="panel-subtitle">{output.rebuttal.summary}</p>
                      {output.rebuttal.issues.length > 0 && (
                        <div className="mt-3 text-xs text-[color:var(--muted)]">
                          {output.rebuttal.issues.map((issue) => (
                            <p key={issue}>- {issue}</p>
                          ))}
                        </div>
                      )}
                      {output.rebuttal.policyReasons.length > 0 && (
                        <div className="mt-3 text-xs text-[color:var(--muted)]">
                          <p className="font-semibold">Policy reasons:</p>
                          {output.rebuttal.policyReasons.map((reason) => (
                            <p key={reason}>- {reason}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {output.evidence && output.evidence.documents.length > 0 && (
                    <div className="panel">
                      <p className="panel-title">Retrieved Documents</p>
                      <div className="mt-3 text-xs text-[color:var(--muted)]">
                        {output.evidence.documents.map((doc) => (
                          <p key={`${doc.title}-${doc.sourceUri}`}>
                            - {doc.title} ({doc.sourceType})
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-[color:var(--muted)]">Output ID: {output.id}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
