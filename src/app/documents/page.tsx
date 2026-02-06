"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  CloudArrowUpIcon, 
  TrashIcon, 
  DocumentTextIcon, 
  CheckBadgeIcon,
  CircleStackIcon
} from "@heroicons/react/24/outline";

type Document = {
  id: string;
  title: string;
  source_uri?: string;
  source_type: string;
  created_at: string;
};

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "library">("upload");
  const [tenantId, setTenantId] = useState("");
  
  // Upload State
  const [title, setTitle] = useState("");
  const [sourceUri, setSourceUri] = useState("");
  const [content, setContent] = useState("");
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Library State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Fetch documents on mount & tab change
  useEffect(() => {
    if (activeTab === "library") {
      fetchDocuments();
    }
  }, [activeTab, tenantId]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/documents", {
        headers: tenantId ? { "x-tenant-id": tenantId } : undefined,
      });
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
        headers: tenantId ? { "x-tenant-id": tenantId } : undefined,
      });
      if (res.ok) {
        fetchDocuments(); // Refresh list
      } else {
        alert("Failed to delete");
      }
    } catch (err) {
      alert("Error deleting document");
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
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
      setUploadResult(`Success! Document stored (ID: ${data.documentId})`);
      setTitle("");
      setSourceUri("");
      setContent("");
      // Optional: switch to library automatically
      // setActiveTab("library");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="main-shell">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
               <CircleStackIcon className="h-6 w-6" />
               <span className="font-bold text-sm tracking-wide uppercase">Knowledge Base</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Evidence Library Control</h1>
            <p className="text-gray-500 mt-2">Manage trusted documents used for RAG grounding.</p>
          </div>
          <div className="flex items-center gap-4">
             <input 
               className="input text-xs w-48"
               placeholder="Tenant ID Override..."
               value={tenantId}
               onChange={e => setTenantId(e.target.value)}
             />
             <Link href="/" className="button button-secondary">Back to Home</Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "upload" 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Upload New Evidence
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "library" 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Browse Library
          </button>
        </div>

        {/* Content */}
        {activeTab === "upload" ? (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="card p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Document Title</label>
                    <input
                      className="input w-full"
                      placeholder="e.g. Employee Handbook 2024"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Source URL (Optional Reference)</label>
                    <input
                      className="input w-full"
                      placeholder="https://..."
                      value={sourceUri}
                      onChange={e => setSourceUri(e.target.value)}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Content Text</label>
                    <textarea
                      className="textarea w-full h-64 font-mono text-xs"
                      placeholder="Paste full document content here to be embedded..."
                      value={content}
                      onChange={e => setContent(e.target.value)}
                    />
                  </div>

                  <button
                    className="button w-full flex justify-center items-center gap-2"
                    onClick={handleUpload}
                    disabled={uploading || !title.trim() || !content.trim()}
                  >
                    {uploading ? <CloudArrowUpIcon className="h-5 w-5 animate-bounce"/> : <CloudArrowUpIcon className="h-5 w-5"/>}
                    {uploading ? "Ingesting & Embedding..." : "Upload & Vectorize"}
                  </button>

                  {uploadError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                      {uploadError}
                    </div>
                  )}
                  {uploadResult && (
                    <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200">
                      {uploadResult}
                    </div>
                  )}
              </div>
            </div>

            <div className="space-y-4">
               <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r shadow-sm">
                  <h4 className="font-bold text-blue-900 text-sm">Why Upload?</h4>
                  <p className="text-xs text-blue-800 mt-1">
                    Uploaded documents are chunked and vectorized locally. The "Prompt Studio" uses RAG to fetch these exact chunks as grounding evidence.
                  </p>
               </div>
               <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <h4 className="font-bold text-gray-700 text-sm mb-2">Supported Formats</h4>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                    <li>Plain Text (Copy-paste)</li>
                    <li>Markdown</li>
                    <li>JSON / CSV Text</li>
                  </ul>
               </div>
            </div>
          </div>
        ) : (
          <div>
            {loadingDocs ? (
               <div className="text-center py-12 text-gray-400">Loading library...</div>
            ) : documents.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No documents found.</p>
                  <button onClick={() => setActiveTab('upload')} className="text-indigo-600 font-medium text-sm mt-2 hover:underline">
                    Upload your first document
                  </button>
               </div>
            ) : (
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 rounded-lg">
                           <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                           <h3 className="font-bold text-gray-900">{doc.title}</h3>
                           <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <CheckBadgeIcon className="h-3 w-3" /> Synced
                              </span>
                              <span>•</span>
                              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                              {doc.source_uri && (
                                <>
                                  <span>•</span>
                                  <a href={doc.source_uri} target="_blank" className="text-indigo-500 hover:underline truncate max-w-xs">{doc.source_uri}</a>
                                </>
                              )}
                           </div>
                        </div>
                     </div>
                     <button 
                       onClick={() => handleDelete(doc.id)}
                       className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                       title="Delete Document"
                     >
                        <TrashIcon className="h-5 w-5" />
                     </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
