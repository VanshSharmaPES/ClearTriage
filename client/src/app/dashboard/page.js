'use client';

import { Fragment, useEffect, useState } from 'react';

const TRIAGE_COLORS = {
    0: 'var(--triage-0)',
    1: 'var(--triage-1)',
    2: 'var(--triage-2)',
    3: 'var(--triage-3)',
    4: 'var(--triage-4)',
    5: 'var(--triage-5)',
};

const TRIAGE_LABELS = {
    0: 'Unassigned',
    1: 'Immediate',
    2: 'Emergent',
    3: 'Urgent',
    4: 'Less Urgent',
    5: 'Non-Urgent',
};

const STATUS_STYLES = {
    Waiting: { bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308' },
    Processing: { bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' },
    Triaged: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
    Admitted: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
};

export default function Dashboard() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const fetchPatients = async () => {
        try {
            const res = await fetch('/api/patients');
            if (!res.ok) throw new Error('Failed to fetch patients');
            const data = await res.json();
            setPatients(data);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
        const interval = setInterval(fetchPatients, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Delete this patient record?')) return;
        try {
            await fetch(`/api/patients/${id}`, { method: 'DELETE' });
            fetchPatients();
        } catch (err) {
            alert('Failed to delete patient');
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    // Count by triage level
    const triagedCount = patients.filter(p => p.triageScore > 0).length;
    const waitingCount = patients.filter(p => p.triageScore === 0).length;

    return (
        <div className="min-h-screen px-6 py-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            Nurse Dashboard
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                            {patients.length} patient{patients.length !== 1 ? 's' : ''} in queue
                            {triagedCount > 0 && <span> · {triagedCount} triaged</span>}
                            {waitingCount > 0 && <span> · {waitingCount} waiting</span>}
                            {lastUpdated && (
                                <span> · Updated {lastUpdated.toLocaleTimeString()}</span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={fetchPatients}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                        style={{
                            background: 'var(--surface-2)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        ↻ Refresh
                    </button>
                </div>

                {/* Triage summary bar */}
                {patients.length > 0 && (
                    <div className="flex gap-3 mb-6 flex-wrap">
                        {[1, 2, 3, 4, 5].map(level => {
                            const count = patients.filter(p => p.triageScore === level).length;
                            if (count === 0) return null;
                            const color = TRIAGE_COLORS[level];
                            return (
                                <div key={level} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                                    style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                                    ESI {level}: {count}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-6 px-4 py-3 rounded-lg text-sm"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        ⚠ {error}
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
                                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Loading patients...</p>
                        </div>
                    </div>
                ) : patients.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <span className="text-5xl block mb-4">🏥</span>
                            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                No patients in queue
                            </h2>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Admitted patients will appear here automatically.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Patient Table */
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--surface-2)' }}>
                                        {['', 'Name', 'Age', 'Gender', 'Symptoms', 'HR', 'Temp', 'BP', 'O₂', 'Triage', 'Status', 'Entry Time', ''].map((h, i) => (
                                            <th key={`${h}-${i}`} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                                                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {patients.map((p) => {
                                        const triageColor = TRIAGE_COLORS[p.triageScore] || TRIAGE_COLORS[0];
                                        const statusStyle = STATUS_STYLES[p.status] || STATUS_STYLES.Waiting;
                                        const isExpanded = expandedId === p._id;
                                        return (
                                            <Fragment key={p._id}>
                                                <tr key={p._id}
                                                    className="transition-colors duration-150 cursor-pointer"
                                                    style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border)' }}
                                                    onClick={() => setExpandedId(isExpanded ? null : p._id)}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    {/* Expand arrow */}
                                                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                        <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>▸</span>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {p.name}
                                                    </td>
                                                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                                                        {p.age}
                                                    </td>
                                                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                                                        {p.gender}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {p.symptoms?.map((s, i) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-full text-xs"
                                                                    style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                        {p.vitals?.heartRate ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                        {p.vitals?.temp ?? '—'}°
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                        {p.vitals?.bpSystolic ?? '—'}/{p.vitals?.bpDiastolic ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                        {p.vitals?.o2Sat ?? '—'}%
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                            style={{ background: `${triageColor}20`, color: triageColor }}>
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: triageColor }} />
                                                            ESI {p.triageScore} — {TRIAGE_LABELS[p.triageScore] || 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                                                            style={{ background: statusStyle.bg, color: statusStyle.color }}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                        {formatTime(p.entryTime)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}
                                                            className="p-1.5 rounded-md transition-colors duration-150 cursor-pointer"
                                                            style={{ color: 'var(--text-muted)' }}
                                                            title="Delete patient"
                                                        >
                                                            🗑
                                                        </button>
                                                    </td>
                                                </tr>
                                                {/* Expanded detail row */}
                                                {isExpanded && (
                                                    <tr key={`${p._id}-detail`}
                                                        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                                                        <td colSpan={13} className="px-8 py-4">
                                                            <div className="flex gap-8">
                                                                {/* AI Reasoning */}
                                                                <div className="flex-1">
                                                                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2"
                                                                        style={{ color: 'var(--accent)' }}>
                                                                        AI Reasoning
                                                                    </h4>
                                                                    {p.aiReasoning?.length > 0 ? (
                                                                        <ul className="space-y-1">
                                                                            {p.aiReasoning.map((r, i) => (
                                                                                <li key={i} className="text-xs"
                                                                                    style={{ color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                                                    {i === 0 ? '→ ' : '  '}{r}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                                            No AI reasoning available
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {/* Vitals detail */}
                                                                <div>
                                                                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2"
                                                                        style={{ color: 'var(--accent)' }}>
                                                                        Full Vitals
                                                                    </h4>
                                                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                                                        <span style={{ color: 'var(--text-muted)' }}>Heart Rate</span>
                                                                        <span style={{ color: 'var(--text-primary)' }}>{p.vitals?.heartRate ?? '—'} bpm</span>
                                                                        <span style={{ color: 'var(--text-muted)' }}>Temperature</span>
                                                                        <span style={{ color: 'var(--text-primary)' }}>{p.vitals?.temp ?? '—'}°</span>
                                                                        <span style={{ color: 'var(--text-muted)' }}>Blood Pressure</span>
                                                                        <span style={{ color: 'var(--text-primary)' }}>{p.vitals?.bpSystolic ?? '—'}/{p.vitals?.bpDiastolic ?? '—'} mmHg</span>
                                                                        <span style={{ color: 'var(--text-muted)' }}>O₂ Saturation</span>
                                                                        <span style={{ color: 'var(--text-primary)' }}>{p.vitals?.o2Sat ?? '—'}%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
