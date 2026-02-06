"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ClipboardDocumentCheckIcon, 
  ClockIcon, 
  HashtagIcon,
  ShieldCheckIcon 
} from "@heroicons/react/24/outline";

type AuditEvent = {
  id: string;
  timestamp: string;
  action_type: string;
  actor_id?: string;
  resource_id?: string;
  details?: any;
  previous_hash?: string;
  hash: string;
};

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit");
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const json = await res.json();
      
      // Map DB fields to UI types
      const mappedEvents = (json.events || []).map((e: any) => ({
        id: e.id,
        timestamp: e.created_at,
        action_type: e.action,
        actor_id: e.actor_id,
        resource_id: e.entity_id,
        details: e.payload,
        hash: e.hash,
        previous_hash: e.prev_hash
      }));
      
      setEvents(mappedEvents);
    } catch (err) {
      setError("Failed to load audit trail.");
      console.error(err);
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
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-indigo-500" />
              <p className="badge">Forensic Ledger</p>
            </div>
            <h1 className="mt-3 text-3xl font-semibold">System Audit Trail</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Tamper-proof, cryptographically chained event logs for compliance.
            </p>
          </div>
          <Link className="link" href="/">Back to Overview</Link>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="card p-12 text-center">
               <ClockIcon className="h-8 w-8 mx-auto text-gray-400 animate-spin" />
               <p className="mt-3 text-gray-500">Loading secure ledger...</p>
            </div>
          ) : error ? (
            <div className="card border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          ) : events.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              No audit events recorded yet. Run a pipeline to generate logs.
            </div>
          ) : (
            <div className="card card-animate overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">Details / Resource</th>
                      <th className="px-6 py-3">Cryptographic Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono text-xs">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                            ${event.action_type === 'POLICY_DECISION' ? 'bg-purple-100 text-purple-700' : 
                              event.action_type === 'RAG_RETRIEVAL' ? 'bg-blue-100 text-blue-700' :
                              event.action_type === 'DOCUMENT_INGESTED' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'}`}>
                            {event.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-gray-600">
                          {event.resource_id ? (
                             <span className="font-mono text-xs">{event.resource_id.substring(0, 8)}...</span>
                          ) : (
                             "-"
                          )}
                          {event.details && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {JSON.stringify(event.details)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 group cursor-pointer" title={event.hash}>
                            <HashtagIcon className="h-4 w-4 text-gray-400" />
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-500 font-mono group-hover:bg-gray-200 transition-colors">
                              {event.hash ? event.hash.substring(0, 16) + "..." : "PENDING"}
                            </code>
                          </div>
                          {event.previous_hash && (
                             <div className="text-[9px] text-gray-300 mt-0.5 pl-6 font-mono">
                               prev: {event.previous_hash.substring(0, 8)}...
                             </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
