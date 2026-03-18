'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const TRIAGE_COLORS = {
    1: 'var(--triage-1)',
    2: 'var(--triage-2)',
    3: 'var(--triage-3)',
    4: 'var(--triage-4)',
    5: 'var(--triage-5)',
};
const TRIAGE_LABELS = {
    1: 'Immediate',
    2: 'Emergent',
    3: 'Urgent',
    4: 'Less Urgent',
    5: 'Non-Urgent',
};

export default function ReportsPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [analytics, setAnalytics] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && !['Admin', 'Doctor', 'Nurse'].includes(user.role)) {
            router.push('/dashboard'); // Only authorized roles can see reports
            return;
        }

        const fetchAnalytics = async () => {
            if (!token) return;
            try {
                const res = await fetch('/api/reports/analytics', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to load analytics');
                const data = await res.json();
                setAnalytics(data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchAnalytics();
    }, [authLoading, user, token, router]);

    const handleExport = async () => {
        try {
            const res = await fetch('/api/reports/csv', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `triage_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            alert(err.message);
        }
    };

    if (authLoading || !analytics) return (
        <div className="flex justify-center mt-20 text-gray-400">Loading reports...</div>
    );

    const pieData = Object.keys(analytics.distributionByLevel).map(level => ({
        name: `ESI ${level} - ${TRIAGE_LABELS[level]}`,
        value: analytics.distributionByLevel[level],
        color: TRIAGE_COLORS[level]
    })).filter(d => d.value > 0);

    const barData = Object.keys(analytics.dailyCounts)
        .sort()
        .map(date => ({
            date: date.slice(5), // exclude year
            count: analytics.dailyCounts[date]
        }));

    return (
        <main className="min-h-[calc(100vh-80px)] px-6 py-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics & Reports</h1>
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                            System insights and triage accuracy overview.
                        </p>
                    </div>
                    {user?.role !== 'Nurse' && (
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            ↓ Export CSV
                        </button>
                    )}
                </div>

                {error && <div className="text-red-500">Error: {error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-6 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Total Patients Triaged</h3>
                        <div className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{analytics.totalTriaged}</div>
                    </div>

                    <div className="p-6 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>AI Accuracy Baseline</h3>
                        <div className="text-4xl font-bold" style={{ color: 'var(--success)' }}>
                            {analytics.aiAccuracyPercentage}%
                        </div>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Ratio of AI predictions un-overridden</p>
                    </div>
                    
                    <div className="p-6 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>System Load</h3>
                        <div className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>Max</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Distribution Chart */}
                    <div className="p-6 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Triage Level Distribution</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Daily Arrival Rate */}
                    <div className="p-6 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Daily Arrivals</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="date" stroke="var(--text-muted)" />
                                    <YAxis stroke="var(--text-muted)" />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                                    <Bar dataKey="count" fill="var(--triage-1)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                
                {/* Confusion Matrix */}
                <div className="p-6 rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Confusion Matrix</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                        Rows = Actual Triage Level (Post-Override), Columns = AI Predicted Triage Level.
                        Diagonal cells denote true positives.
                    </p>
                    <table className="w-full text-center border-collapse text-sm">
                        <thead>
                            <tr>
                                <th className="border p-2" style={{ borderColor: 'var(--border)' }}>Actual \\ Predicted</th>
                                {[1, 2, 3, 4, 5].map(v => <th key={v} className="border p-2" style={{ borderColor: 'var(--border)' }}>ESI {v}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((actualRow, idxRow) => (
                                <tr key={idxRow}>
                                    <td className="border p-2 font-bold" style={{ borderColor: 'var(--border)' }}>ESI {actualRow}</td>
                                    {analytics.confusionMatrix[idxRow].map((colVal, idxCol) => (
                                        <td key={idxCol} className={`border p-2 ${idxRow === idxCol ? 'bg-indigo-900/40 text-indigo-200' : ''}`} style={{ borderColor: 'var(--border)' }}>
                                            {colVal}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </main>
    );
}