"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AuditEvent = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  created_at: string;
  hash: string;
  prev_hash: string | null;
};

export default function AuditPage() {
  const [tenantId, setTenantId] = useState("");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/audit", {
        headers: tenantId ? { "x-tenant-id": tenantId } : undefined,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load audit log");
      }
      setEvents(data.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  return (
    <div className="main-shell">
      <div className="mx-auto w-full max-w-6xl">
        <div className="topbar">
          <div>
            <p className="badge">Audit Ledger</p>
            <h1 className="mt-3 text-3xl font-semibold">
              Jejak audit tamper-resistant
            </h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Audit digunakan setelah review untuk memastikan semua langkah
              governance terekam.
            </p>
          </div>
          <Link className="link" href="/">
            Back to Overview
          </Link>
        </div>

        <div className="mt-8 grid-two">
          <div className="card card-animate">
            <div className="card-body">
              <p className="badge">Kapan digunakan</p>
              <h2 className="section-title mt-3">
                Setelah approval atau rejection
              </h2>
              <p className="section-subtitle">
                Gunakan audit log untuk meninjau alur keputusan dan melakukan
                forensic review.
              </p>
              <div className="callout mt-4">
                <p className="text-sm font-semibold">Flow</p>
                <p className="section-subtitle">
                  Prompt &rarr; Output &rarr; Review &rarr; Audit
                </p>
              </div>
            </div>
          </div>

          <div className="card card-animate">
            <div className="card-body grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-semibold">
                  Tenant ID (optional override)
                </label>
                <input
                  className="input mt-2"
                  placeholder="Optional tenant override"
                  value={tenantId}
                  onChange={(event) => setTenantId(event.target.value)}
                />
              </div>
              <div className="stat">
                <span className="stat-label">Events</span>
                <span className="stat-value">{events.length}</span>
              </div>
              <div className="flex items-end">
                <button
                  className="button"
                  onClick={loadAudit}
                  disabled={loading}
                >
                  {loading ? "Refreshing" : "Refresh Ledger"}
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

        <div className="mt-6 card">
          <div className="card-body timeline">
            {events.map((event) => (
              <div key={event.id} className="timeline-item">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill">{event.action}</span>
                  <span className="badge">{event.entity_type}</span>
                  <span className="text-xs text-[color:var(--muted)]">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 text-xs text-[color:var(--muted)]">
                  <p>Entity: {event.entity_id}</p>
                  <p>Hash: {event.hash}</p>
                  {event.prev_hash && <p>Prev: {event.prev_hash}</p>}
                </div>
                <pre className="mt-3 whitespace-pre-wrap text-xs text-[color:var(--muted)]">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
