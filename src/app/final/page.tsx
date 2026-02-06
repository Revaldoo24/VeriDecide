"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type FinalOutput = {
  id: string;
  status: string;
  content: string;
  confidence: number | string | null;
  confidence_internal?: number | string | null;
  confidence_open_source?: number | string | null;
  legal_risk?: string | null;
  bias_risk?: string | null;
  bias_flags?: string[] | null;
  created_at: string;
  prompt?: { title?: string | null; domain?: string | null; urgency?: string | null; tags?: string[]; text?: string } | null;
  review?: { decision?: string | null; justification?: string | null; created_at?: string | null };
  evidence?: { documents: Array<{ title: string; sourceUri: string | null }> };
};

export default function FinalOutputsPage() {
  const [tenantId, setTenantId] = useState("");
  const [outputs, setOutputs] = useState<FinalOutput[]>([]);
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
      const approved = (data.outputs ?? []).filter((item: FinalOutput) => item.status === "APPROVED");
      setOutputs(approved);
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
            <p className="badge">Final Output</p>
            <h1 className="mt-3 text-3xl font-semibold">Output yang sudah disetujui</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Untuk user standar: hasil final beserta sumber, skor risiko, dan catatan review.
            </p>
          </div>
          <Link className="link" href="/">Back to Overview</Link>
        </div>

        <div className="mt-8 card card-animate">
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
              <span className="stat-label">Approved Outputs</span>
              <span className="stat-value">{outputs.length}</span>
            </div>
            <div className="flex items-end">
              <button className="button" onClick={loadOutputs} disabled={loading}>
                {loading ? "Refreshing" : "Refresh"}
              </button>
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
            const confidence = output.confidence === null ? null : Number(output.confidence);
            const confidenceInternal =
              output.confidence_internal === null || output.confidence_internal === undefined
                ? null
                : Number(output.confidence_internal);
            const confidenceOpen =
              output.confidence_open_source === null || output.confidence_open_source === undefined
                ? null
                : Number(output.confidence_open_source);
            return (
              <div key={output.id} className="card">
                <div className="card-body grid gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill">APPROVED</span>
                    <span className="badge">Legal Risk: {output.legal_risk ?? "N/A"}</span>
                    <span className="badge">Bias Risk: {output.bias_risk ?? "N/A"}</span>
                    <span className="badge">
                      Confidence: {confidence !== null ? confidence.toFixed(2) : "N/A"}
                    </span>
                  </div>
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
                      {output.prompt.text && (
                        <p className="panel-subtitle">{output.prompt.text}</p>
                      )}
                    </div>
                  )}
                  <div className="panel">
                    <p className="panel-title">Final Output</p>
                    <p className="panel-subtitle">{output.content}</p>
                  </div>
                  <div className="panel">
                    <p className="panel-title">Confidence by Source</p>
                    <p className="panel-subtitle">
                      Internal: {confidenceInternal !== null ? confidenceInternal.toFixed(2) : "N/A"}
                    </p>
                    <p className="panel-subtitle">
                      Open-source: {confidenceOpen !== null ? confidenceOpen.toFixed(2) : "N/A"}
                    </p>
                  </div>
                  {output.evidence && output.evidence.documents.length > 0 && (
                    <div className="panel">
                      <p className="panel-title">Sources</p>
                      <div className="mt-2 text-xs text-[color:var(--muted)]">
                        {output.evidence.documents.map((doc) => (
                          <p key={`${doc.title}-${doc.sourceUri}`}>- {doc.title}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {output.review?.justification && (
                    <div className="panel">
                      <p className="panel-title">Reviewer Note</p>
                      <p className="panel-subtitle">{output.review.justification}</p>
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
