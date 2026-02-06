"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

// --- Types ---
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load outputs on mount
  useEffect(() => {
    loadOutputs();
  }, []);

  const loadOutputs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/outputs", {
        headers: tenantId ? { "x-tenant-id": tenantId } : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to load outputs");
      
      const allOutputs = (data.outputs ?? []) as OutputOption[];
      setOutputs(allOutputs);
      
      // Auto-select first pending item if any
      if (!selectedId && allOutputs.length > 0) {
        const firstPending = allOutputs.find(o => o.status === "PENDING_REVIEW");
        if (firstPending) setSelectedId(firstPending.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const selectedOutput = outputs.find(o => o.id === selectedId);

  // Reset/Init form when selection changes
  useEffect(() => {
    if (selectedOutput) {
      setJustification("");
      setEditedContent(selectedOutput.content);
      setIsEditing(false);
    }
  }, [selectedOutput]);

  const submitReview = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    
    const hasModifications = isEditing && editedContent !== selectedOutput?.content;

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantId ? { "x-tenant-id": tenantId } : {}),
        },
        body: JSON.stringify({ 
          outputId: selectedId, 
          decision, 
          justification: justification || `Manually ${decision.toLowerCase()} by reviewer` + (hasModifications ? " (with edits)" : ""),
          modifiedContent: hasModifications ? editedContent : null
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Review failed");
      
      setSuccessMsg(`Output successfully ${decision}`);
      loadOutputs(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper metrics
  const evidenceRatio = selectedOutput?.analytics?.evidenceRatio ?? 
                        (selectedOutput?.validation?.score ? Number(selectedOutput.validation.score) : 0);
  const confidence = selectedOutput?.confidence ? Number(selectedOutput.confidence) : 0;
  
  const pendingCount = outputs.filter(o => o.status === "PENDING_REVIEW").length;

  return (
    <div className="main-shell h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">Human Review Station</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount} items awaiting your decision
          </p>
        </div>
        <div className="flex items-center gap-4">
           <input 
             className="input text-xs py-1 px-3 w-48"
             placeholder="Tenant ID Override..."
             value={tenantId}
             onChange={e => setTenantId(e.target.value)}
           />
           <Link href="/" className="text-sm font-medium text-gray-600 hover:text-indigo-600">
             Exit to Overview
           </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar List */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto shrink-0 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-gray-50 z-10">
            <h3 className="font-semibold text-gray-700">Queue</h3>
            <button onClick={loadOutputs} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
               <ClockIcon className="h-3 w-3" /> Refresh
            </button>
          </div>
          
          <div className="divide-y divide-gray-100">
            {loading ? (
               <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
            ) : outputs.length === 0 ? (
               <div className="p-8 text-center text-sm text-gray-400">No outputs found</div>
            ) : (
              outputs.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-4 hover:bg-white transition-colors border-l-4 ${
                    selectedId === item.id 
                      ? "bg-white border-indigo-500 shadow-sm" 
                      : "bg-transparent border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      item.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
                      item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                    {item.prompt?.title || item.prompt?.text || "Untitled Prompt"}
                  </h4>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span className={Number(item.risk_level) === 1 ? 'text-green-600' : 'text-orange-600'}>
                      Risk: {item.risk_level || "N/A"}
                    </span>
                    <span>•</span>
                    <span>Conf: {(Number(item.confidence || 0) * 100).toFixed(0)}%</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {selectedOutput ? (
             <div className="max-w-4xl mx-auto space-y-6">
               
               {/* 1. Decision Panel (Top Priority) */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <div className="flex items-start justify-between">
                   <div>
                     <h2 className="text-lg font-bold text-gray-900">Make a Decision</h2>
                     <p className="text-sm text-gray-500">Review the evidence and validity below before acting.</p>
                   </div>
                   <div className="text-right">
                      <span className="text-xs font-mono text-gray-400 block mb-1">Output ID</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{selectedOutput.id.substring(0,8)}...</code>
                   </div>
                 </div>

                 <div className="mt-6">
                   <label className="block text-sm font-medium text-gray-700 mb-2">Reviewer Justification</label>
                   <textarea
                     className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                     rows={3}
                     placeholder="Why are you approving or rejecting this output? (Mandatory for rejections)"
                     value={justification}
                     onChange={e => setJustification(e.target.value)}
                   />
                 </div>

                 {/* Action Buttons */}
                 <div className="mt-6 flex gap-4 border-t border-gray-100 pt-6">
                   <button 
                     onClick={() => submitReview("APPROVED")}
                     disabled={submitting}
                     className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                   >
                     {submitting ? <ClockIcon className="h-5 w-5 animate-spin"/> : <CheckCircleIcon className="h-5 w-5"/>}
                     {isEditing ? "Approve Edited Output" : "Approve Output"}
                   </button>
                   <button 
                     onClick={() => submitReview("REJECTED")}
                     disabled={submitting}
                     className="flex-1 bg-white border border-red-200 text-red-700 hover:bg-red-50 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                   >
                     <XCircleIcon className="h-5 w-5"/>
                     Reject Output
                   </button>
                 </div>
                 
                 {error && (
                   <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                     <ExclamationTriangleIcon className="h-4 w-4"/> {error}
                   </div>
                 )}
                 {successMsg && (
                   <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2">
                     <CheckCircleIcon className="h-4 w-4"/> {successMsg}
                   </div>
                 )}
               </div>

               {/* 2. Metadata & Risk Metrics */}
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"> 
                   <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                     <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" /> Risk Intelligence
                   </h3>
                   <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Evidence Overlap</span>
                          <span className="font-bold">{(Number(evidenceRatio) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${Number(evidenceRatio) > 0.7 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Number(evidenceRatio) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Model Confidence</span>
                          <span className="font-bold">{(confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${confidence > 0.8 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${confidence * 100}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                         <div className="p-3 bg-gray-50 rounded-lg text-center">
                            <span className="block text-xs text-gray-500 uppercase">Legal Risk</span>
                            <span className="font-bold text-gray-900">{selectedOutput.legal_risk || "N/A"}</span>
                         </div>
                         <div className="p-3 bg-gray-50 rounded-lg text-center">
                            <span className="block text-xs text-gray-500 uppercase">Bias Risk</span>
                            <span className="font-bold text-gray-900">{selectedOutput.bias_risk || "N/A"}</span>
                         </div>
                      </div>
                   </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"> 
                   <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                     <DocumentMagnifyingGlassIcon className="h-4 w-4 text-indigo-500" /> Prompt Context
                   </h3>
                   <div className="space-y-3">
                     <div>
                       <span className="text-xs text-gray-500">Title</span>
                       <p className="font-medium text-gray-900">{selectedOutput.prompt?.title || "-"}</p>
                     </div>
                     <div>
                       <span className="text-xs text-gray-500">Domain / Urgency</span>
                       <div className="flex gap-2 mt-1">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{selectedOutput.prompt?.domain || "General"}</span>
                          <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{selectedOutput.prompt?.urgency || "Normal"}</span>
                       </div>
                     </div>
                     <div>
                       <span className="text-xs text-gray-500">Full Prompt</span>
                       <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded mt-1 border border-gray-100">
                         "{selectedOutput.prompt?.text}"
                       </p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* 3. Output & Evidence Comparison */}
               <div className="grid md:grid-cols-2 gap-6 items-start">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Proposed AI Answer</h3>
                      <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`text-xs px-2 py-1 rounded font-medium border ${isEditing ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200'}`}
                      >
                         {isEditing ? "Cancel Edit" : "✏️ Modify Answer"}
                      </button>
                    </div>
                    
                    {isEditing ? (
                      <textarea 
                        className="w-full h-96 p-4 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
                        value={editedContent}
                        onChange={e => setEditedContent(e.target.value)}
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                        {selectedOutput.content}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Supporting Evidence</h3>
                    {selectedOutput.analytics?.sources && selectedOutput.analytics.sources.length > 0 ? (
                      <div className="space-y-3">
                        {selectedOutput.analytics.sources.map((source, i) => (
                           <div key={i} className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-indigo-900 text-xs px-1.5 bg-indigo-200 rounded">{source.citation}</span>
                                <span className="text-xs text-indigo-400">Sim: {(Number(source.similarity || 0)).toFixed(2)}</span>
                              </div>
                              <p className="font-medium text-indigo-900 text-xs mb-1 line-clamp-1">{source.title}</p>
                              <span className="text-[10px] text-indigo-500 uppercase tracking-wider">{source.sourceType}</span>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm italic">
                        No specific evidence citations found.
                      </div>
                    )}
                  </div>
               </div>

             </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <DocumentMagnifyingGlassIcon className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Select an item to review</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
