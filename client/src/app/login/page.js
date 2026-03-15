'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.username.trim() || !form.password) {
            return setError('Username and password are required.');
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            login(data.token, data.user);
            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = {
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        outline: 'none',
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <span className="text-5xl block mb-4">🔐</span>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Sign In
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Access the ClearTriage system
                    </p>
                </div>

                {error && (
                    <div className="mb-6 px-4 py-3 rounded-lg text-sm"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        ⚠ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="rounded-xl p-6"
                        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>

                        <div className="mb-4">
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Username
                            </label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                placeholder="Enter your username"
                                className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                style={inputStyle}
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="Enter your password"
                                className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                style={inputStyle}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 rounded-xl text-base font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                            style={{ background: 'var(--accent)', color: '#fff', border: 'none', boxShadow: '0 0 20px var(--accent-glow)' }}
                        >
                            {submitting ? 'Signing in...' : 'Sign In →'}
                        </button>
                    </div>
                </form>

                <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="font-medium no-underline" style={{ color: 'var(--accent)' }}>
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
