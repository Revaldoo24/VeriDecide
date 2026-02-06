"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheckIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

// Define simpler Types for readability
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
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-6 w-6 text-indigo-500" />
              <p className="badge">Prompt Studio</p>
            </div>
            <h1 className="mt-3 text-3xl font-semibold">Submit Regulatory Query</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              The first step to running a governed RAG pipeline.
            </p>
          </div>
          <Link className="link" href="/">Back to Overview</Link>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-8">
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
                placeholder="Brief title for this decision"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />

              <div className="mt-6 grid grid-cols-2 gap-4">
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
                placeholder="e.g. compliance, funds, jakarta"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />

              <div className="mt-6 panel">
                <div className="flex items-center gap-2">
                  <GlobeAltIcon className="h-5 w-5 text-blue-500" />
                  <p className="panel-title">Open-source evidence (SERP)</p>
                </div>
                <p className="panel-subtitle">
                  Enable to fetch open-source evidence before answering.
                </p>
                <label className="mt-3 flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowOpenSource}
                    onChange={(event) => setAllowOpenSource(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Allow open-source ingestion
                </label>
                {allowOpenSource && (
                  <input
                    className="input mt-3"
                    placeholder="SERP Query (optional override)"
                    value={openSourceQuery}
                    onChange={(event) => setOpenSourceQuery(event.target.value)}
                  />
                )}
              </div>

              <label className="mt-6 text-sm font-semibold">Prompt</label>
              <textarea
                className="textarea mt-2 min-h-[120px]"
                placeholder="e.g. What are the data retention obligations for regulatory decisions?"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />

              <button
                className="button mt-6 w-full justify-center"
                onClick={submit}
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 animate-spin" />
                    Running Governance Pipeline...
                  </span>
                ) : (
                  "Run Governed Pipeline"
                )}
              </button>

              <div className="callout mt-6">
                <p className="text-sm font-semibold">After submitting</p>
                <p className="section-subtitle">
                  Check results on the `/outputs` page to view status, risk levels, and confidence scores.
                </p>
              </div>
            </div>
          </div>

          <div className="card card-animate">
            <div className="card-body grid gap-5">
              <div>
                <p className="badge">Service Modules</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="panel">
                     <div className="flex items-center gap-2 mb-2">
                         <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                         <h3 className="panel-title">RAG Orchestrator</h3>
                     </div>
                    <p className="panel-subtitle">Evidence retrieval & prompt composition.</p>
                  </div>
                  <div className="panel">
                      <div className="flex items-center gap-2 mb-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                        <h3 className="panel-title">Policy Engine</h3>
                      </div>
                    <p className="panel-subtitle">Enforce thresholds and forbidden topics.</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="badge">Governance Steps</p>
                <div className="flow mt-4">
                  <div className="flow-step">
                    <div className="flow-index">1</div>
                    <div className="flow-body">
                      <h4>RAG Retrieval</h4>
                      <p className="section-subtitle">Fetch evidence from validated documents.</p>
                    </div>
                  </div>
                  <div className="flow-step">
                    <div className="flow-index">2</div>
                    <div className="flow-body">
                      <h4>LLM Draft</h4>
                      <p className="section-subtitle">Create draft with mandatory citations.</p>
                    </div>
                  </div>
                  <div className="flow-step">
                    <div className="flow-index">3</div>
                    <div className="flow-body">
                      <h4>Validation</h4>
                      <p className="section-subtitle">Check claims vs evidence, label groundedness.</p>
                    </div>
                  </div>
                  <div className="flow-step">
                    <div className="flow-index">4</div>
                    <div className="flow-body">
                      <h4>Policy Gate</h4>
                      <p className="section-subtitle">Check thresholds: evidence, risk, confidence.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="card mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
            <XCircleIcon className="h-5 w-5 text-red-700" />
            {error}
          </div>
        )}

        {result && (
          <div className="grid gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Header */}
            <div className="card border-l-4 border-l-indigo-500">
              <div className="card-body flex items-center justify-between">
                <div>
                  <p className="badge">Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    {result.validation === "GROUNDED" ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    ) : (
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
                    )}
                    <h2 className="text-xl font-bold">
                      {result.status} - {result.validation}
                    </h2>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Governance Decision</p>
                   <p className="text-2xl font-bold text-gray-900">{result.status?.includes("REJECTED") ? "REJECTED" : "APPROVED"}</p>
                </div>
              </div>
            </div>

            {result.prompt && (
              <div className="card card-animate">
                <div className="card-body">
                  <h2 className="section-title">Prompt Metadata</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                    <div>
                      <span className="text-xs text-gray-500 uppercase">Title</span>
                      <p className="font-medium">{result.prompt.title || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">Domain</span>
                      <p className="font-medium">{result.prompt.domain || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">Urgency</span>
                      <p className="font-medium">{result.prompt.urgency || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">Tags</span>
                      <p className="font-medium">{result.prompt.tags?.join(", ") || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              {result.rawOutput && (
                <div className="card card-animate">
                  <div className="card-body">
                    <h2 className="section-title text-gray-500">AI Draft (Raw Output)</h2>
                    <p className="section-subtitle mb-4">
                       Pure output from the LLM before governance layer validation.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{result.rawOutput}</p>
                    </div>
                  </div>
                </div>
              )}

              {result.analytics && (
                <div className="card card-animate">
                  <div className="card-body">
                    <h2 className="section-title">Risk Analysis (Risk Engine)</h2>
                    <p className="section-subtitle mb-4">
                      Automated evaluation of confidence, grounding, and bias.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="panel bg-blue-50 border-blue-100">
                        <span className="text-xs text-blue-600 font-bold uppercase">Confidence</span>
                        <p className="text-2xl font-bold text-blue-900">
                          {(Number(result.confidence || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="panel bg-green-50 border-green-100">
                        <span className="text-xs text-green-600 font-bold uppercase">Evidence Ratio</span>
                        <p className="text-2xl font-bold text-green-900">
                          {(Number(result.analytics.evidenceRatio || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="panel bg-gray-50 border-gray-100">
                        <span className="text-xs text-gray-600 font-bold uppercase">Legal Risk</span>
                        <p className="text-lg font-bold text-gray-900">{result.legalRisk || "N/A"}</p>
                      </div>
                      <div className="panel bg-gray-50 border-gray-100">
                        <span className="text-xs text-gray-600 font-bold uppercase">Bias Risk</span>
                        <p className="text-lg font-bold text-gray-900">{result.biasRisk || "N/A"}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Evidence Sources</h3>
                      {result.analytics.sources && result.analytics.sources.length > 0 ? (
                        <div className="space-y-2">
                          {result.analytics.sources.map((source, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded border border-gray-100">
                              <span className="font-mono text-xs bg-gray-200 px-1 rounded text-gray-600">{source.citation}</span>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 truncate">{source.title || "Untitled Document"}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <span className={`px-1.5 py-0.5 rounded ${source.sourceType === 'internal' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {source.sourceType || "internal"}
                                  </span>
                                  <span>Sim: {Number(source.similarity || 0).toFixed(4)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No evidence sources cited.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Governance Action Cards */}
            <div className="grid lg:grid-cols-2 gap-6">
               {result.governedSummary && (
                <div className="card card-animate border-l-4 border-l-green-500">
                  <div className="card-body">
                    <h2 className="section-title text-green-700">Governance Summary (Approved)</h2>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700">
                      {result.governedSummary.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                    {result.governedOutput && (
                       <div className="mt-4 pt-4 border-t border-gray-100">
                         <p className="text-xs uppercase text-gray-500 font-bold">Final Approved Output</p>
                         <p className="mt-2 text-gray-900 bg-green-50 p-3 rounded border border-green-100">{result.governedOutput}</p>
                       </div>
                    )}
                  </div>
                </div>
              )}

              {result.rebuttal && (
                <div className="card card-animate border-l-4 border-l-red-500">
                  <div className="card-body">
                    <h2 className="section-title text-red-700">Governance Rebuttal (Blocked)</h2>
                    <p className="section-subtitle text-red-600 font-medium">{result.rebuttal.summary}</p>
                    
                    {result.rebuttal.issues.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-gray-700 uppercase">Issues Detected</p>
                        <ul className="list-disc list-inside mt-1 text-sm text-red-600">
                          {result.rebuttal.issues.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.rebuttal.policyReasons.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-gray-700 uppercase">Policy Violations</p>
                        <ul className="list-disc list-inside mt-1 text-sm text-gray-600">
                          {result.rebuttal.policyReasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {result.openSourceIngest && (
              <div className="card card-animate">
                <div className="card-body">
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="h-5 w-5 text-gray-500" />
                    <h2 className="section-title">Open-source Ingestion Logs</h2>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                     <div className="panel bg-gray-50">
                        <span className="text-xs block text-gray-500">Attempted</span>
                        <span className="font-bold text-lg">{result.openSourceIngest.attempted}</span>
                     </div>
                     <div className="panel bg-green-50 border-green-100">
                        <span className="text-xs block text-green-600">Ingested</span>
                        <span className="font-bold text-lg text-green-700">{result.openSourceIngest.ingested}</span>
                     </div>
                     <div className="panel bg-orange-50 border-orange-100">
                        <span className="text-xs block text-orange-600">Skipped</span>
                        <span className="font-bold text-lg text-orange-700">{result.openSourceIngest.skipped}</span>
                     </div>
                  </div>
                  
                  {result.openSourceIngest.skippedDomains && result.openSourceIngest.skippedDomains.length > 0 && (
                     <div className="mt-4">
                       <p className="text-xs font-bold text-gray-500 uppercase mb-2">Skipped Domain Reasons</p>
                       <div className="space-y-1">
                         {result.openSourceIngest.skippedDomains.map((item, i) => (
                           <p key={i} className="text-xs text-gray-600 flex justify-between border-b border-gray-100 pb-1">
                             <span className="font-medium">{item.host}</span>
                             <span className="italic text-gray-400">{item.reason}</span>
                           </p>
                         ))}
                       </div>
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
