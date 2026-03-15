'use client';

import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

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
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass-panel"
            style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
            <Link href="/" className="flex items-center gap-2 no-underline group">
                <span className="text-xl font-bold transition-transform group-hover:scale-110" style={{ color: 'var(--accent)' }}>⚡</span>
                <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>ClearTriage</span>
            </Link>
            <div className="flex items-center gap-2">
                {!loading && user ? (
                    <>
                        <Link href="/dashboard"
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 no-underline hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ color: 'var(--text-primary)' }}>
                            Dashboard
                        </Link>
                        <Link href="/admit"
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 no-underline hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ color: 'var(--text-primary)' }}>
                            Admit Patient
                        </Link>
                        <div className="flex items-center gap-3 ml-4 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest"
                                style={{ background: `${ROLE_COLORS[user.role] || '#6b7280'}15`, color: ROLE_COLORS[user.role] || '#6b7280', border: `1px solid ${ROLE_COLORS[user.role]}30` }}>
                                {user.role}
                            </span>
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                {user.username}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5"
                                style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            >
                                Logout
                            </button>
                        </div>
                    </>
                ) : !loading ? (
                    <>
                        <Link href="/login"
                            className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 no-underline hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ color: 'var(--text-primary)' }}>
                            Sign In
                        </Link>
                        <Link href="/register"
                            className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 no-underline shadow-sm hover:scale-105"
                            style={{ background: 'var(--text-primary)', color: 'var(--color-background)' }}>
                            Register
                        </Link>
                    </>
                ) : null}
                <div className="ml-2 pl-2 flex items-center" style={{ borderLeft: '1px solid var(--border)' }}>
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}
