"use client";

import { useState } from "react";
import Link from "next/link";

type PipelineResult = {
  output?: string;
  rawOutput?: string;
  governedOutput?: string;
  governedSummary?: {
    headline: string;
    notes: string[];
  };
  rebuttal?: {
    summary: string;
    issues: string[];
    policyReasons: string[];
    evidenceRatio: number | null;
  };
  openSourceIngest?: {
    query: string;
    attempted: number;
    ingested: number;
    skipped: number;
    skippedDomains?: Array<{ url: string; host: string; reason: string }>;
    errors: Array<{ url: string; reason: string }>;
    debug?: { allowlist: string[]; provider: string };
  };
  status?: string;
  validation?: string;
  confidence?: number | string | null;
  risk?: string | null;
  legalRisk?: string | null;
  biasRisk?: string | null;
  biasFlags?: string[] | null;
  confidenceBySource?: {
    internal?: number | null;
    openSource?: number | null;
  };
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
  prompt?: {
    title?: string;
    domain?: string;
    urgency?: string;
    tags?: string[];
    keywordHits?: string[];
  };
};

export default function PromptPage() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("Education Policy");
  const [urgency, setUrgency] = useState("Medium");
  const [tags, setTags] = useState("");
  const [allowOpenSource, setAllowOpenSource] = useState(false);
  const [openSourceQuery, setOpenSourceQuery] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantId ? { "x-tenant-id": tenantId } : {}),
        },
        body: JSON.stringify({
          prompt,
          title,
          domain,
          urgency,
          tags,
          allowOpenSource,
          openSourceQuery,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Pipeline failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-shell">
      <div className="mx-auto w-full max-w-6xl">
        <div className="topbar">
          <div>
            <p className="badge">Prompt Studio</p>
            <h1 className="mt-3 text-3xl font-semibold">Submit pertanyaan regulasi</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Langkah pertama untuk menjalankan RAG pipeline yang ter-govern.
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
                placeholder="Leave blank to use DEMO_TENANT_ID"
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
              />

              <label className="mt-6 text-sm font-semibold">Title</label>
              <input
                className="input mt-2"
                placeholder="Judul ringkas keputusan"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />

              <div className="mt-6 grid-two">
                <div>
                  <label className="text-sm font-semibold">Domain</label>
                  <select
                    className="select mt-2"
                    value={domain}
                    onChange={(event) => setDomain(event.target.value)}
                  >
                    <option value="Education Policy">Education Policy</option>
                    <option value="Public Policy">Public Policy</option>
                    <option value="Legal">Legal</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">Urgency</label>
                  <select
                    className="select mt-2"
                    value={urgency}
                    onChange={(event) => setUrgency(event.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <label className="mt-6 text-sm font-semibold">Tags (comma separated)</label>
              <input
                className="input mt-2"
                placeholder="contoh: bantuan pendidikan, jakarta"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />

              <div className="mt-6 panel">
                <p className="panel-title">Open-source evidence (SERP)</p>
                <p className="panel-subtitle">
                  Aktifkan untuk mengambil bukti dari open-source sebelum menjawab.
                </p>
                <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={allowOpenSource}
                    onChange={(event) => setAllowOpenSource(event.target.checked)}
                  />
                  Allow open-source ingestion
                </label>
                {allowOpenSource && (
                  <input
                    className="input mt-3"
                    placeholder="Query SERP (opsional override)"
                    value={openSourceQuery}
                    onChange={(event) => setOpenSourceQuery(event.target.value)}
                  />
                )}
              </div>

              <label className="mt-6 text-sm font-semibold">Prompt</label>
              <textarea
                className="textarea mt-2"
                placeholder="Contoh: Apa kewajiban retensi data untuk keputusan regulasi?"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />

              <button
                className="button mt-6"
                onClick={submit}
                disabled={loading || !prompt.trim()}
              >
                {loading ? "Running Governance Pipeline" : "Run Governed Pipeline"}
              </button>

              <div className="callout mt-6">
                <p className="text-sm font-semibold">Setelah submit</p>
                <p className="section-subtitle">
                  Cek hasil di halaman `/outputs` untuk melihat status, risk, dan confidence.
                </p>
              </div>
            </div>
          </div>

          <div className="card card-animate">
            <div className="card-body grid gap-5">
              <div>
                <p className="badge">Apa yang terjadi di belakang?</p>
                <h2 className="section-title mt-3">Governance steps</h2>
                <div className="flow mt-4">
                  <div className="flow-step">
                    <div className="flow-index">1</div>
                    <div className="flow-body">
                      <h4>RAG Retrieval</h4>
                      <p className="section-subtitle">Ambil evidence dari dokumen tervalidasi.</p>
                    </div>
                  </div>
                  <div className="flow-step">
                    <div className="flow-index">2</div>
                    <div className="flow-body">
                      <h4>LLM Draft</h4>
                      <p className="section-subtitle">Buat draft dengan sitasi wajib.</p>
                    </div>
                  </div>
                  <div className="flow-step">
                    <div className="flow-index">3</div>
                    <div className="flow-body">
                      <h4>Validation</h4>
                      <p className="section-subtitle">Cek klaim vs evidence, beri label groundedness.</p>
                    </div>
                  </div>
                  <div className="flow-step">
                    <div className="flow-index">4</div>
                    <div className="flow-body">
                      <h4>Policy Gate</h4>
                      <p className="section-subtitle">Cek threshold evidence, risk, confidence.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="badge">Service Modules</p>
                <div className="grid-two mt-3">
                  <div className="panel">
                    <h3 className="panel-title">RAG Orchestrator</h3>
                    <p className="panel-subtitle">Evidence retrieval & prompt composition.</p>
                  </div>
                  <div className="panel">
                    <h3 className="panel-title">Policy Engine</h3>
                    <p className="panel-subtitle">Enforce thresholds and forbidden topics.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="card mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="grid gap-4 mt-6">
            {result.rawOutput && (
              <div className="card card-animate">
                <div className="card-body">
                  <h2 className="section-title">Jawaban AI Asli (Raw)</h2>
                  <p className="section-subtitle">
                    Ini adalah output murni dari Gemini sebelum validasi/governance.
                  </p>
                  <p className="section-subtitle">{result.rawOutput}</p>
                </div>
              </div>
            )}
            {result.analytics && (
              <div className="card card-animate">
                <div className="card-body">
                  <h2 className="section-title">Analisis Output AI Asli</h2>
                  <p className="section-subtitle">
                    Ringkasan ini menjelaskan seberapa kuat dukungan evidence, tingkat risiko, dan sumber mana saja
                    yang dipakai oleh jawaban AI.
                  </p>
                  <div className="grid-two mt-4">
                    <div>
                      <p className="section-subtitle">
                        Validation: {result.validation ?? "N/A"}
                      </p>
                      <p className="section-subtitle">
                        Evidence Ratio:{" "}
                        {result.analytics.evidenceRatio !== null && result.analytics.evidenceRatio !== undefined
                          ? Number(result.analytics.evidenceRatio).toFixed(2)
                          : "N/A"}
                      </p>
                      <p className="section-subtitle">
                        Confidence:{" "}
                        {result.confidence !== null && result.confidence !== undefined
                          ? Number(result.confidence).toFixed(2)
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="section-subtitle">
                        Legal Risk: {result.legalRisk ?? result.risk ?? "N/A"}
                      </p>
                      <p className="section-subtitle">
                        Bias Risk: {result.biasRisk ?? "N/A"}
                      </p>
                      {result.biasFlags && result.biasFlags.length > 0 && (
                        <p className="section-subtitle">
                          Bias Flags: {result.biasFlags.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  {result.analytics.sources && result.analytics.sources.length > 0 && (
                    <div className="mt-4 text-xs text-[color:var(--muted)]">
                      {result.analytics.sources.map((source) => (
                        <p key={`${source.citation}-${source.title}`}>
                          {source.citation} - {source.title ?? "Untitled"} -{" "}
                          {source.sourceType ?? "internal"} - Similarity:{" "}
                          {source.similarity !== null && source.similarity !== undefined
                            ? Number(source.similarity).toFixed(2)
                            : "N/A"}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {result.governedSummary && (
              <div className="card card-animate">
                <div className="card-body">
                  <h2 className="section-title">Governance Summary</h2>
                  {result.governedSummary.notes.map((note) => (
                    <p key={note} className="section-subtitle">- {note}</p>
                  ))}
                </div>
              </div>
            )}
            {result.governedOutput && (
              <div className="card card-animate">
                <div className="card-body">
                  <h2 className="section-title">Output Setelah Governance</h2>
                  <p className="section-subtitle">{result.governedOutput}</p>
                </div>
              </div>
            )}
            {result.prompt && (
              <div className="card card-animate">
                <div className="card-body">
                  <h2 className="section-title">Prompt Metadata</h2>
                  <p className="section-subtitle">Title: {result.prompt.title || "-"}</p>
                  <p className="section-subtitle">Domain: {result.prompt.domain || "-"}</p>
                  <p className="section-subtitle">Urgency: {result.prompt.urgency || "-"}</p>
                  {result.prompt.tags && result.prompt.tags.length > 0 && (
                    <p className="section-subtitle">Tags: {result.prompt.tags.join(", ")}</p>
                  )}
                  {result.prompt.keywordHits && result.prompt.keywordHits.length > 0 && (
                    <p className="section-subtitle">
                      Keyword hits: {result.prompt.keywordHits.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}
            {result.rebuttal && (
              <div className="card card-animate">
                <div className="card-body">
                  <h2 className="section-title">Sanggahan Governance</h2>
                  <p className="section-subtitle">{result.rebuttal.summary}</p>
                  {result.rebuttal.issues.length > 0 && (
                    <div className="mt-3 text-xs text-[color:var(--muted)]">
                      {result.rebuttal.issues.map((issue) => (
                        <p key={issue}>- {issue}</p>
                      ))}
                    </div>
                  )}
                  {result.rebuttal.policyReasons.length > 0 && (
                    <div className="mt-3 text-xs text-[color:var(--muted)]">
                      <p className="font-semibold">Policy reasons:</p>
                      {result.rebuttal.policyReasons.map((reason) => (
                        <p key={reason}>- {reason}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {result.openSourceIngest && (
              <div className="card card-animate">
                <div className="card-body">
                  <h2 className="section-title">Open-source Ingestion</h2>
                  <p className="section-subtitle">
                    Query: {result.openSourceIngest.query}
                  </p>
                  <p className="section-subtitle">
                    Attempted: {result.openSourceIngest.attempted} - Ingested: {result.openSourceIngest.ingested} - Skipped: {result.openSourceIngest.skipped}
                  </p>
                  {result.openSourceIngest.debug && (
                    <div className="mt-3 text-xs text-[color:var(--muted)]">
                      <p>Provider: {result.openSourceIngest.debug.provider || "unknown"}</p>
                      <p>Allowlist: {result.openSourceIngest.debug.allowlist.join(", ") || "(empty)"}</p>
                    </div>
                  )}
                  {result.openSourceIngest.skippedDomains && result.openSourceIngest.skippedDomains.length > 0 && (
                    <div className="mt-3 text-xs text-[color:var(--muted)]">
                      <p className="font-semibold">Skipped domains:</p>
                      {result.openSourceIngest.skippedDomains.map((item) => (
                        <p key={item.url}>- {item.host}: {item.reason}</p>
                      ))}
                    </div>
                  )}
                  {result.openSourceIngest.errors.length > 0 && (
                    <div className="mt-3 text-xs text-[color:var(--muted)]">
                      {result.openSourceIngest.errors.map((errorItem) => (
                        <p key={errorItem.url}>- {errorItem.url}: {errorItem.reason}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="card">
              <div className="card-body">
                <p className="badge">Status</p>
                <p className="section-subtitle mt-2">
                  {result.status} - {result.validation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
