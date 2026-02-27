import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        {/* Hero */}
        <div className="mb-8">
          <span className="text-6xl mb-4 block">⚕</span>
          <h1 className="text-5xl font-bold mb-4 tracking-tight"
            style={{ color: 'var(--text-primary)' }}>
            Clear<span style={{ color: 'var(--accent)' }}>Triage</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-lg mx-auto"
            style={{ color: 'var(--text-secondary)' }}>
            An intelligent, explainable AI-powered hospital triage system.
            Prioritize patients with transparent, evidence-based urgency scoring.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 no-underline"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}>
            Open Dashboard →
          </Link>
          <Link href="/admit"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 no-underline border"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              background: 'var(--surface-2)',
            }}>
            Admit Patient
          </Link>
        </div>

        {/* Status badges */}
        <div className="mt-12 flex justify-center gap-6 flex-wrap">
          {[
            { label: 'ESI 1 — Immediate', color: 'var(--triage-1)' },
            { label: 'ESI 2 — Emergent', color: 'var(--triage-2)' },
            { label: 'ESI 3 — Urgent', color: 'var(--triage-3)' },
            { label: 'ESI 4 — Less Urgent', color: 'var(--triage-4)' },
            { label: 'ESI 5 — Non-Urgent', color: 'var(--triage-5)' },
          ].map(({ label, color }) => (
            <span key={label} className="inline-flex items-center gap-2 text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
