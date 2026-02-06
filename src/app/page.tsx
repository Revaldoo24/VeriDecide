import Link from "next/link";

export default function Home() {
  return (
    <div className="main-shell">
      <div className="mx-auto w-full max-w-6xl">
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark" />
            <div className="brand-text">
              <span className="brand-title">VeriDecide</span>
              <span className="brand-subtitle">Governance Control Plane</span>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <Link className="link" href="/prompts">Prompt Studio</Link>
            <Link className="link" href="/outputs">Outputs</Link>
            <Link className="link" href="/reviews">Reviews</Link>
            <Link className="link" href="/final">Final Output</Link>
            <Link className="link" href="/documents">Evidence Library</Link>
            <Link className="link" href="/audit">Audit Log</Link>
          </div>
        </div>

        <section className="hero">
          <div className="hero-card card-animate text-center py-10">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              VeriDecide
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Responsible GenAI Governance for Regulated Decisions
            </p>
            
            <div className="flex justify-center gap-4">
              <Link className="button px-8 py-3 text-lg" href="/prompts">
                Start Decision Pipeline
              </Link>
              <Link className="button button-secondary px-8 py-3 text-lg" href="/documents">
                Upload Evidence
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/prompts" className="card hover:shadow-lg transition-all p-6 text-center group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📝</div>
            <h3 className="font-bold text-lg mb-1">Prompt Studio</h3>
            <p className="text-sm text-gray-500">Submit queries & run governance</p>
          </Link>

          <Link href="/outputs" className="card hover:shadow-lg transition-all p-6 text-center group">
             <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="font-bold text-lg mb-1">Review Outputs</h3>
            <p className="text-sm text-gray-500">Check risk scores & validation</p>
          </Link>

          <Link href="/reviews" className="card hover:shadow-lg transition-all p-6 text-center group">
             <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⚖️</div>
            <h3 className="font-bold text-lg mb-1">Human Approval</h3>
            <p className="text-sm text-gray-500">Approve or reject decisions</p>
          </Link>

          <Link href="/audit" className="card hover:shadow-lg transition-all p-6 text-center group">
             <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🛡️</div>
            <h3 className="font-bold text-lg mb-1">Audit Log</h3>
            <p className="text-sm text-gray-500">Forensic trail of all actions</p>
          </Link>
        </section>

        <section className="mt-10 card card-animate">
          <div className="card-body">
            <h2 className="section-title text-center mb-6">Platform Architecture</h2>
            <div className="grid-three mt-5">
              <div className="panel text-center">
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-bold mb-1">RAG Orchestrator</h3>
                <p className="text-xs text-gray-500">Evidence retrieval & verification</p>
              </div>
              <div className="panel text-center">
                <div className="text-2xl mb-2">🛡️</div>
                <h3 className="font-bold mb-1">Policy Engine</h3>
                <p className="text-xs text-gray-500">Constraint enforcement</p>
              </div>
              <div className="panel text-center">
                <div className="text-2xl mb-2">📉</div>
                <h3 className="font-bold mb-1">Risk Scorer</h3>
                <p className="text-xs text-gray-500">Bias & risk analysis</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 card card-animate">
          <div className="card-body grid gap-6 md:grid-cols-3">
            <div>
              <p className="badge">Governance Invariant</p>
              <h3 className="mt-3 text-xl font-semibold">LLM tetap untrusted</h3>
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                Semua keputusan berada di policy layer, bukan di model.
              </p>
            </div>
            <div>
              <p className="badge">Evidence Control</p>
              <h3 className="mt-3 text-xl font-semibold">Hanya sumber tervalidasi</h3>
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                Dokumen disimpan dengan checksum dan versioning.
              </p>
            </div>
            <div>
              <p className="badge">Accountability</p>
              <h3 className="mt-3 text-xl font-semibold">Audit siap forensik</h3>
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                Semua langkah masuk ledger yang tidak bisa diubah.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
