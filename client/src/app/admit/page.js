'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const COMMON_SYMPTOMS = [
    'Chest Pain', 'Shortness of Breath', 'Fever', 'Nausea',
    'Headache', 'Abdominal Pain', 'Dizziness', 'Back Pain',
    'Cough', 'Vomiting', 'Fatigue', 'Seizure',
];

export default function AdmitPatient() {
    const router = useRouter();
    const { user, token, loading: authLoading } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [customSymptom, setCustomSymptom] = useState('');

    const [form, setForm] = useState({
        name: '',
        age: '',
        gender: '',
        symptoms: [],
        vitals: {
            heartRate: '',
            temp: '',
            bpSystolic: '',
            bpDiastolic: '',
            o2Sat: '',
        },
    });

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const updateVital = (field, value) => {
        setForm((prev) => ({
            ...prev,
            vitals: { ...prev.vitals, [field]: value },
        }));
    };

    const toggleSymptom = (symptom) => {
        setForm((prev) => ({
            ...prev,
            symptoms: prev.symptoms.includes(symptom)
                ? prev.symptoms.filter((s) => s !== symptom)
                : [...prev.symptoms, symptom],
        }));
    };

    const addCustomSymptom = () => {
        const trimmed = customSymptom.trim();
        if (trimmed && !form.symptoms.includes(trimmed)) {
            setForm((prev) => ({
                ...prev,
                symptoms: [...prev.symptoms, trimmed],
            }));
            setCustomSymptom('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!form.name.trim()) return setError('Patient name is required');
        if (!form.age || form.age < 0 || form.age > 150) return setError('Please enter a valid age (0–150)');
        if (!form.gender) return setError('Please select a gender');
        if (form.symptoms.length === 0) return setError('Please select at least one symptom');

        setSubmitting(true);
        try {
            const payload = {
                name: form.name.trim(),
                age: Number(form.age),
                gender: form.gender,
                symptoms: form.symptoms,
                vitals: {
                    heartRate: form.vitals.heartRate ? Number(form.vitals.heartRate) : undefined,
                    temp: form.vitals.temp ? Number(form.vitals.temp) : undefined,
                    bpSystolic: form.vitals.bpSystolic ? Number(form.vitals.bpSystolic) : undefined,
                    bpDiastolic: form.vitals.bpDiastolic ? Number(form.vitals.bpDiastolic) : undefined,
                    o2Sat: form.vitals.o2Sat ? Number(form.vitals.o2Sat) : undefined,
                },
            };

            const res = await fetch('/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (res.status === 401) {
                router.push('/login');
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to admit patient');
            }

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

    const labelStyle = {
        color: 'var(--text-secondary)',
    };

    if (authLoading) return null;
    if (!user) return null;

    return (
        <div className="min-h-[calc(100vh-80px)] px-6 py-12">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Admit Patient
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Enter patient details to add them to the triage queue
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 px-4 py-3 rounded-lg text-sm"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        ⚠ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="rounded-xl p-6 mb-6"
                        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>

                        {/* Section: Patient Info */}
                        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4"
                            style={{ color: 'var(--text-muted)' }}>
                            Patient Information
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Full Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    placeholder="Enter patient name"
                                    className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Age</label>
                                <input
                                    type="number"
                                    value={form.age}
                                    onChange={(e) => updateField('age', e.target.value)}
                                    placeholder="Age"
                                    min="0" max="150"
                                    className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Gender</label>
                            <div className="flex gap-2">
                                {['Male', 'Female', 'Other'].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => updateField('gender', g)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                                        style={{
                                            background: form.gender === g ? 'var(--accent)' : 'var(--surface-2)',
                                            color: form.gender === g ? '#fff' : 'var(--text-secondary)',
                                            border: `1px solid ${form.gender === g ? 'var(--accent)' : 'var(--border)'}`,
                                        }}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <hr className="my-6" style={{ borderColor: 'var(--border)' }} />

                        {/* Section: Symptoms */}
                        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4"
                            style={{ color: 'var(--text-muted)' }}>
                            Chief Complaints / Symptoms
                        </h2>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {COMMON_SYMPTOMS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => toggleSymptom(s)}
                                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                                    style={{
                                        background: form.symptoms.includes(s) ? 'var(--accent)' : 'var(--surface-3)',
                                        color: form.symptoms.includes(s) ? '#fff' : 'var(--text-secondary)',
                                        border: `1px solid ${form.symptoms.includes(s) ? 'var(--accent)' : 'var(--border)'}`,
                                    }}
                                >
                                    {form.symptoms.includes(s) ? '✓ ' : ''}{s}
                                </button>
                            ))}
                        </div>

                        {/* Custom symptom */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customSymptom}
                                onChange={(e) => setCustomSymptom(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSymptom())}
                                placeholder="Add custom symptom..."
                                className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                style={inputStyle}
                            />
                            <button type="button" onClick={addCustomSymptom}
                                className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                                style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                + Add
                            </button>
                        </div>

                        {/* Divider */}
                        <hr className="my-6" style={{ borderColor: 'var(--border)' }} />

                        {/* Section: Vitals */}
                        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4"
                            style={{ color: 'var(--text-muted)' }}>
                            Vital Signs
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Heart Rate (bpm)</label>
                                <input
                                    type="number"
                                    value={form.vitals.heartRate}
                                    onChange={(e) => updateVital('heartRate', e.target.value)}
                                    placeholder="e.g. 80"
                                    className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Temperature (°F)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={form.vitals.temp}
                                    onChange={(e) => updateVital('temp', e.target.value)}
                                    placeholder="e.g. 98.6"
                                    className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>O₂ Saturation (%)</label>
                                <input
                                    type="number"
                                    value={form.vitals.o2Sat}
                                    onChange={(e) => updateVital('o2Sat', e.target.value)}
                                    placeholder="e.g. 98"
                                    className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>BP Systolic (mmHg)</label>
                                <input
                                    type="number"
                                    value={form.vitals.bpSystolic}
                                    onChange={(e) => updateVital('bpSystolic', e.target.value)}
                                    placeholder="e.g. 120"
                                    className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>BP Diastolic (mmHg)</label>
                                <input
                                    type="number"
                                    value={form.vitals.bpDiastolic}
                                    onChange={(e) => updateVital('bpDiastolic', e.target.value)}
                                    placeholder="e.g. 80"
                                    className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors focus:border-(--accent)"
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 rounded-xl text-base font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                        style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            border: 'none',
                            boxShadow: '0 0 20px var(--accent-glow)',
                        }}
                    >
                        {submitting ? 'Admitting Patient...' : 'Admit Patient →'}
                    </button>
                </form>
            </div>
        </div>
    );
}
