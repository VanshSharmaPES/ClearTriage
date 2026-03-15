'use client';

import Link from "next/link";
import { useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center pt-24 px-6 pb-32" style={{ overflow: 'hidden' }}>
      <div className="max-w-2xl text-center flex-1 flex flex-col justify-center w-full">
        {/* Hero — animated entrance */}
        <div
          className="mb-12 relative"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sky-500/20 dark:bg-sky-500/10 blur-[80px] rounded-full -z-10" />
          <span className="text-6xl mb-2 block" style={{
            animation: mounted ? 'pulse-glow 3s ease-in-out infinite' : 'none',
          }}>⚡</span>
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight"
            style={{ color: 'var(--text-primary)' }}>
            Clear<span style={{ color: 'var(--accent)' }}>Triage</span>
          </h1>
          <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium"
            style={{ color: 'var(--text-secondary)' }}>
            Intelligent, explainable algorithms that fuse advanced <span className="text-sky-600 dark:text-sky-400">SHAP analytics</span> with rapid hospital triage. Prioritize with clarity.
          </p>
        </div>

        {/* CTA Buttons — staggered animation */}
        <div
          className="flex flex-col sm:flex-row gap-5 justify-center"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
          }}
        >
          {!loading && user ? (
            // Logged in — show app navigation
            <>
              <Link href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-sm uppercase tracking-wider font-bold transition-all duration-300 no-underline hover:scale-105"
                style={{
                  background: 'var(--text-primary)',
                  color: 'var(--color-background)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                }}>
                Launch Dashboard →
              </Link>
              <Link href="/admit"
                className="glass-panel inline-flex items-center justify-center px-8 py-4 rounded-full text-sm uppercase tracking-wider font-bold transition-all duration-300 no-underline hover:scale-105 hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  color: 'var(--text-primary)',
                }}>
                Admit Patient
              </Link>
            </>
          ) : !loading ? (
            // Not logged in — show auth buttons
            <>
              <Link href="/login"
                className="inline-flex items-center justify-center px-10 py-4 rounded-full text-sm uppercase tracking-wider font-bold transition-all duration-300 no-underline hover:scale-105"
                style={{
                  background: 'var(--text-primary)',
                  color: 'var(--color-background)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                }}>
                Access System →
              </Link>
              <Link href="/register"
                className="glass-panel inline-flex items-center justify-center px-10 py-4 rounded-full text-sm uppercase tracking-wider font-bold transition-all duration-300 no-underline hover:scale-105 hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  color: 'var(--text-primary)',
                }}>
                Authorized Registration
              </Link>
            </>
          ) : null}
        </div>

        {/* Feature highlights — staggered */}
        <div
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
          }}
        >
          {[
            { tag: '01', title: 'Radical Transparency', desc: 'SHAP force plots explain every algorithmic decision to clinicians.' },
            { tag: '02', title: 'Zero Latency', desc: 'WebSocket-driven synchronization. No polling, pure speed.' },
            { tag: '03', title: 'Secure Enclave', desc: 'Strict RBAC protocols. Keep patient data segmented and protected.' },
          ].map(({ tag, title, desc }) => (
            <div key={title}
              className="glass-panel p-8 rounded-2xl text-left transition-all duration-500 hover:-translate-y-2 group"
            >
              <div className="text-xs font-mono mb-6 text-sky-500 font-bold tracking-widest">{tag} //</div>
              <h3 className="text-lg font-bold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* ESI badges — staggered */}
        <div
          className="mt-24 mb-12 flex justify-center gap-6 md:gap-8 flex-wrap glass-panel px-6 md:px-8 py-4 rounded-3xl md:rounded-full mx-auto w-[90%] md:w-fit"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s',
          }}
        >
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
