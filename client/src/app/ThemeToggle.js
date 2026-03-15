'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-8 h-8" />; // Placeholder to avoid layout shift

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center cursor-pointer"
            style={{ 
                color: 'var(--text-secondary)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)' 
            }}
            aria-label="Toggle Dark Mode"
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </button>
    );
}