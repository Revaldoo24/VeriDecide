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
          <div className="hero-card card-animate">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge">Regulatory Decision Support</span>
              <span className="pill">LLM Untrusted</span>
              <span className="tag">Governed RAG</span>
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight">
              Responsible GenAI governance for high-stakes regulatory workflows.
            </h1>
            <p className="mt-4 text-lg text-[color:var(--muted)]">
              Jalankan pipeline yang terkontrol: evidence retrieval, validasi klaim, kebijakan, dan audit trail
              sebelum keputusan disetujui manusia.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link className="button" href="/prompts">Mulai di Prompt Studio</Link>
              <Link className="button button-secondary" href="/outputs">Lihat Output Terbaru</Link>
            </div>
          </div>
          <div className="card card-animate">
            <div className="card-body kpi-grid">
              <div className="kpi">
                <div className="kpi-value">60%</div>
                <div className="kpi-label">Min Evidence</div>
              </div>
              <div className="kpi">
                <div className="kpi-value">Medium</div>
                <div className="kpi-label">Max Risk</div>
              </div>
              <div className="kpi">
                <div className="kpi-value">Hash</div>
                <div className="kpi-label">Audit Integrity</div>
              </div>
              <div className="kpi">
                <div className="kpi-value">Human</div>
                <div className="kpi-label">Final Approval</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid-two">
          <div className="card card-animate">
            <div className="card-body">
              <p className="badge">Alur Penggunaan</p>
              <h2 className="section-title mt-3">Apa yang harus dilakukan dulu?</h2>
              <p className="section-subtitle">
                Ikuti alur ini supaya output selalu melewati governance gate.
              </p>
              <div className="flow mt-5">
                <div className="flow-step">
                  <div className="flow-index">1</div>
                  <div className="flow-body">
                    <h4>Prompt Studio</h4>
                    <p className="section-subtitle">Mulai di `/prompts` untuk submit pertanyaan.</p>
                  </div>
                </div>
                <div className="flow-step">
                  <div className="flow-index">2</div>
                  <div className="flow-body">
                    <h4>Output Review</h4>
                    <p className="section-subtitle">Cek output di `/outputs` beserta risk & confidence.</p>
                  </div>
                </div>
                <div className="flow-step">
                  <div className="flow-index">3</div>
                  <div className="flow-body">
                    <h4>Human Review</h4>
                    <p className="section-subtitle">Approve atau reject di `/reviews` dengan justifikasi.</p>
                  </div>
                </div>
                <div className="flow-step">
                  <div className="flow-index">4</div>
                  <div className="flow-body">
                    <h4>Audit Log</h4>
                    <p className="section-subtitle">Trace semua langkah di `/audit`.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card card-animate">
            <div className="card-body">
              <p className="badge">Navigasi Cepat</p>
              <h2 className="section-title mt-3">Di mana fitur berada?</h2>
              <p className="section-subtitle">Setiap fitur utama punya halaman khusus.</p>
              <div className="feature-grid mt-5">
                <div className="feature-card">
                  <p className="tag">/prompts</p>
                  <h3 className="mt-3 text-lg font-semibold">Governed RAG</h3>
                  <p className="section-subtitle">Submit prompt dan jalankan retrieval evidence.</p>
                </div>
                <div className="feature-card">
                  <p className="tag">/outputs</p>
                  <h3 className="mt-3 text-lg font-semibold">Validation & Scoring</h3>
                  <p className="section-subtitle">Lihat groundedness, risk, confidence.</p>
                </div>
                <div className="feature-card">
                  <p className="tag">/reviews</p>
                  <h3 className="mt-3 text-lg font-semibold">Human Approval</h3>
                  <p className="section-subtitle">Review dengan justifikasi wajib.</p>
                </div>
                <div className="feature-card">
                  <p className="tag">/audit</p>
                  <h3 className="mt-3 text-lg font-semibold">Audit Ledger</h3>
                  <p className="section-subtitle">Jejak keputusan, hash chain, forensik.</p>
                </div>
                <div className="feature-card">
                  <p className="tag">/final</p>
                  <h3 className="mt-3 text-lg font-semibold">Final Output</h3>
                  <p className="section-subtitle">Output yang sudah disetujui untuk user standar.</p>
                </div>
                <div className="feature-card">
                  <p className="tag">/documents</p>
                  <h3 className="mt-3 text-lg font-semibold">Evidence Library</h3>
                  <p className="section-subtitle">Upload dokumen kebijakan untuk evidence RAG.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 card card-animate">
          <div className="card-body">
            <p className="badge">Microservice Map</p>
            <h2 className="section-title mt-3">Komponen layanan yang membantu fitur</h2>
            <p className="section-subtitle">
              Implementasi MVP masih satu app, tetapi modul ini bisa dipisah menjadi microservice.
            </p>
            <div className="grid-three mt-5">
              <div className="panel">
                <h3 className="panel-title">RAG Orchestrator</h3>
                <p className="panel-subtitle">Retrieve evidence, build prompt, attach citations.</p>
              </div>
              <div className="panel">
                <h3 className="panel-title">Validation Service</h3>
                <p className="panel-subtitle">Claim checking & groundedness classification.</p>
              </div>
              <div className="panel">
                <h3 className="panel-title">Policy Engine</h3>
                <p className="panel-subtitle">Thresholds, forbidden topics, gating output.</p>
              </div>
              <div className="panel">
                <h3 className="panel-title">Risk & Bias Scorer</h3>
                <p className="panel-subtitle">Confidence + risk level + bias flags.</p>
              </div>
              <div className="panel">
                <h3 className="panel-title">Audit Ledger</h3>
                <p className="panel-subtitle">Append-only log + hash chain integrity.</p>
              </div>
              <div className="panel">
                <h3 className="panel-title">Review Workflow</h3>
                <p className="panel-subtitle">Human approval with justification.</p>
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
