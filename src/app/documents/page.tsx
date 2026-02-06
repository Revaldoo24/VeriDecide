"use client";

import { useState } from "react";
import Link from "next/link";

export default function DocumentsPage() {
  const [tenantId, setTenantId] = useState("");
  const [title, setTitle] = useState("");
  const [sourceUri, setSourceUri] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantId ? { "x-tenant-id": tenantId } : {}),
        },
        body: JSON.stringify({ title, sourceUri, content }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to ingest document");
      }
      setResult(`Document stored. ID: ${data.documentId}. Chunks: ${data.chunks}`);
      setContent("");
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
            <p className="badge">Evidence Library</p>
            <h1 className="mt-3 text-3xl font-semibold">Upload dokumen kebijakan</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Tambahkan dokumen kebijakan agar prompt bisa dijawab dengan evidence yang sah.
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

              <label className="mt-6 text-sm font-semibold">Document Title</label>
              <input
                className="input mt-2"
                placeholder="Contoh: Kebijakan Bantuan Pendidikan Jakarta v3.1"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />

              <label className="mt-6 text-sm font-semibold">Source URL (optional)</label>
              <input
                className="input mt-2"
                placeholder="https://..."
                value={sourceUri}
                onChange={(event) => setSourceUri(event.target.value)}
              />

              <label className="mt-6 text-sm font-semibold">Document Content</label>
              <textarea
                className="textarea mt-2"
                placeholder="Tempel isi kebijakan di sini"
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />

              <button
                className="button mt-6"
                onClick={submit}
                disabled={loading || !title.trim() || !content.trim()}
              >
                {loading ? "Uploading" : "Upload Evidence"}
              </button>
            </div>
          </div>

          <div className="card card-animate">
            <div className="card-body grid gap-5">
              <div>
                <p className="badge">How to use</p>
                <h2 className="section-title mt-3">Urutan yang disarankan</h2>
                <div className="flow mt-4">
                  <div className="flow-step">
                    <div className="flow-index">1</div>
                    <div className="flow-body">
                      <h4>Upload kebijakan</h4>
                      <p className="section-subtitle">Masukkan dokumen agar menjadi evidence.</p>
                    </div>
                  </div>
                  <div className="flow-step">
                    <div className="flow-index">2</div>
                    <div className="flow-body">
                      <h4>Prompt Studio</h4>
                      <p className="section-subtitle">Tanyakan ringkasan atau risiko kebijakan.</p>
                    </div>
                  </div>
                  <div className="flow-step">
                    <div className="flow-index">3</div>
                    <div className="flow-body">
                      <h4>Review output</h4>
                      <p className="section-subtitle">Validasi dan approve dengan catatan.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="callout">
                <p className="text-sm font-semibold">Tips</p>
                <p className="section-subtitle">Isi dokumen harus teks bersih agar chunking bekerja optimal.</p>
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
