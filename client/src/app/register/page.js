'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ROLES = ['Nurse', 'Doctor'];

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ username: '', password: '', role: 'Nurse' });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.username.trim()) return setError('Username is required.');
        if (!form.password || form.password.length < 6) return setError('Password must be at least 6 characters.');

        setSubmitting(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            router.push('/login');
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
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <span className="text-5xl block mb-4">👤</span>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Create Account
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Register to access ClearTriage
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
                                placeholder="Choose a username"
                                className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                style={inputStyle}
                                autoFocus
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="Min. 6 characters"
                                className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                style={inputStyle}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Role
                            </label>
                            <div className="flex gap-2">
                                {ROLES.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setForm({ ...form, role: r })}
                                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                                        style={{
                                            background: form.role === r ? 'var(--accent)' : 'var(--surface-2)',
                                            color: form.role === r ? '#fff' : 'var(--text-secondary)',
                                            border: `1px solid ${form.role === r ? 'var(--accent)' : 'var(--border)'}`,
                                        }}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 rounded-xl text-base font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                            style={{ background: 'var(--accent)', color: '#fff', border: 'none', boxShadow: '0 0 20px var(--accent-glow)' }}
                        >
                            {submitting ? 'Creating account...' : 'Create Account →'}
                        </button>
                    </div>
                </form>

                <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium no-underline" style={{ color: 'var(--accent)' }}>
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
