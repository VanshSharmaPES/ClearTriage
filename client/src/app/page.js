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
    <div className="min-h-screen flex items-center justify-center px-6" style={{ overflow: 'hidden' }}>
      <div className="max-w-2xl text-center">
        {/* Hero — animated entrance */}
        <div
          className="mb-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <span className="text-6xl mb-4 block" style={{
            animation: mounted ? 'pulse-glow 2s ease-in-out infinite' : 'none',
          }}>⚕</span>
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

        {/* CTA Buttons — staggered animation */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center"
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
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 no-underline hover:scale-105"
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  boxShadow: '0 0 20px var(--accent-glow)',
                }}>
                Open Dashboard →
              </Link>
              <Link href="/admit"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 no-underline border hover:scale-105"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  background: 'var(--surface-2)',
                }}>
                Admit Patient
              </Link>
            </>
          ) : !loading ? (
            // Not logged in — show auth buttons
            <>
              <Link href="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 no-underline hover:scale-105"
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  boxShadow: '0 0 25px var(--accent-glow)',
                }}>
                Sign In →
              </Link>
              <Link href="/register"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 no-underline border hover:scale-105"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  background: 'var(--surface-2)',
                }}>
                Create Account
              </Link>
            </>
          ) : null}
        </div>

        {/* Feature highlights — staggered */}
        <div
          className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
          }}
        >
          {[
            { icon: '🔮', title: 'Explainable AI', desc: 'SHAP-powered reasoning for every triage decision' },
            { icon: '⚡', title: 'Real-Time', desc: 'WebSocket-driven live updates across all clients' },
            { icon: '🛡️', title: 'Role-Based', desc: 'Secure access control for Nurses, Doctors & Admins' },
          ].map(({ icon, title, desc }) => (
            <div key={title}
              className="p-4 rounded-xl text-left transition-all duration-300 hover:scale-105"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
              }}>
              <span className="text-2xl block mb-2">{icon}</span>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* ESI badges — staggered */}
        <div
          className="mt-10 flex justify-center gap-6 flex-wrap"
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
