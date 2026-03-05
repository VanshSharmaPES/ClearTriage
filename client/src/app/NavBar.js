'use client';

import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';

const ROLE_COLORS = {
    Admin: '#ef4444',
    Doctor: '#6366f1',
    Nurse: '#22c55e',
};

export default function NavBar() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
            <Link href="/" className="flex items-center gap-2 no-underline">
                <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>⚕</span>
                <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>ClearTriage</span>
            </Link>
            <div className="flex items-center gap-1">
                {!loading && user ? (
                    <>
                        <Link href="/dashboard"
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline"
                            style={{ color: 'var(--text-secondary)' }}>
                            Dashboard
                        </Link>
                        <Link href="/admit"
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline"
                            style={{ color: 'var(--text-secondary)' }}>
                            Admit Patient
                        </Link>
                        <div className="flex items-center gap-2 ml-4 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                                style={{ background: `${ROLE_COLORS[user.role] || '#6b7280'}20`, color: ROLE_COLORS[user.role] || '#6b7280' }}>
                                {user.role}
                            </span>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {user.username}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                                style={{ color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                            >
                                Logout
                            </button>
                        </div>
                    </>
                ) : !loading ? (
                    <>
                        <Link href="/login"
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline"
                            style={{ color: 'var(--text-secondary)' }}>
                            Sign In
                        </Link>
                        <Link href="/register"
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline"
                            style={{ background: 'var(--accent)', color: '#fff', borderRadius: '8px' }}>
                            Register
                        </Link>
                    </>
                ) : null}
            </div>
        </nav>
    );
}
