'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, check localStorage for existing token
    useEffect(() => {
        const savedToken = localStorage.getItem('ct_token');
        if (savedToken) {
            setToken(savedToken);
            // Verify token by calling /api/auth/me
            fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${savedToken}` },
            })
                .then(res => {
                    if (!res.ok) throw new Error('Token invalid');
                    return res.json();
                })
                .then(userData => {
                    setUser(userData);
                })
                .catch(() => {
                    // Token expired or invalid
                    localStorage.removeItem('ct_token');
                    setToken(null);
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (newToken, userData) => {
        localStorage.setItem('ct_token', newToken);
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('ct_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
