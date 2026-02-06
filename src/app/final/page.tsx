"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  CheckBadgeIcon, 
  ShieldCheckIcon, 
  DocumentCheckIcon,
  ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/solid";

type FinalOutput = {
  id: string;
  status: string;
  content: string;
  governed_output?: string | null;
  confidence: number | string | null;
  risk_level: string;
  legal_risk?: string | null;
  bias_risk?: string | null;
  created_at: string;
  prompt?: { title?: string | null; text?: string; domain?: string } | null;
  review?: { decision?: string; justification?: string };
  evidence?: { documents: Array<{ title: string; sourceUri: string | null }> };
};

export default function FinalOutputsPage() {
  const [tenantId, setTenantId] = useState("");
  const [outputs, setOutputs] = useState<FinalOutput[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOutputs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/outputs", {
        headers: tenantId ? { "x-tenant-id": tenantId } : undefined,
      });
      const data = await response.json();
      if (data.outputs) {
        // Filter only APPROVED for the final registry
        const approved = (data.outputs as FinalOutput[]).filter(o => o.status === "APPROVED");
        setOutputs(approved);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutputs();
  }, [tenantId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Navbar / Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-lg shadow-md">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">VeriDecide</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-1">Executive Decision Registry</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <input 
             className="px-3 py-1.5 bg-gray-100 border-none rounded text-xs font-medium text-gray-600 w-48 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
             placeholder="Tenant ID Override..."
             value={tenantId}
             onChange={e => setTenantId(e.target.value)}
           />
           <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
             Overview
           </Link>
           <button onClick={loadOutputs} className="text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors">
             Refresh
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Approved Decisions</h2>
          <p className="text-gray-500 mt-2 max-w-2xl">
            This registry contains only AI outputs that have passed autonomous validation steps and received authoritative human approval.
            These records are cryptographically verified and ready for distribution.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : outputs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <DocumentCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No Approved Decisions Yet</h3>
            <p className="text-gray-500 mt-1 mb-4">Process items in the Review Station first.</p>
            <Link href="/reviews" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Go to Reviews
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {outputs.map((item) => {
              // Determine final content: use governed_output if available (edited), otherwise original content
              const finalContent = item.governed_output || item.content;
              const isEdited = !!item.governed_output;

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Status Bar */}
                  <div className="bg-green-50 border-b border-green-100 px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-700 text-xs font-bold uppercase tracking-wide">
                      <CheckBadgeIcon className="h-4 w-4" />
                      Verified & Approved
                    </div>
                    <div className="text-xs text-green-600 font-mono">
                      ID: {item.id.split('-')[0]}...
                    </div>
                  </div>

                  <div className="p-6 grid md:grid-cols-3 gap-8">
                    {/* Left: Context */}
                    <div className="md:col-span-1 space-y-4 border-r border-gray-100 pr-4">
                      <div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inquiry</span>
                        <h3 className="font-bold text-gray-900 mt-1 leading-snug">
                          {item.prompt?.title || "Untitled Inquiry"}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2 italic bg-gray-50 p-3 rounded border border-gray-100">
                          "{item.prompt?.text}"
                        </p>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Domain: {item.prompt?.domain || "General"}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.risk_level === 'HIGH' ? 'bg-red-100 text-red-800' : 
                          item.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          Risk: {item.risk_level}
                        </span>
                      </div>
                    </div>

                    {/* Right: Final Decision */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Final Governance Output</span>
                         {isEdited && (
                           <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                             Edited by Reviewer
                           </span>
                         )}
                      </div>
                      
                      <div className="prose prose-sm max-w-none text-gray-800 bg-white leading-relaxed">
                        {finalContent.split('\n').map((line, i) => (
                           line ? <p key={i} className="mb-2">{line}</p> : <br key={i}/>
                        ))}
                      </div>

                      {/* Evidence Footer */}
                      {item.evidence?.documents && item.evidence.documents.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                           <p className="text-xs font-semibold text-gray-500 mb-2">Grounded in Trusted Sources:</p>
                           <ul className="space-y-1">
                             {item.evidence.documents.map((doc, idx) => (
                               <li key={idx} className="flex items-center gap-2 text-xs text-indigo-600">
                                 <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                                 <span className="truncate max-w-sm">{doc.title}</span>
                               </li>
                             ))}
                           </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
