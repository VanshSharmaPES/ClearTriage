const express = require('express');
const router = express.Router();
const axios = require('axios');
const Patient = require('../models/Patient');

const ML_SERVICE_URL = 'http://localhost:8000/predict';

// GET /api/patients — list all patients (most urgent first, then newest)
router.get('/', async (req, res) => {
    try {
        const patients = await Patient.find().sort({ triageScore: 1, entryTime: -1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/patients — create a new patient + auto-triage via ML
router.post('/', async (req, res) => {
    try {
        // 1. Save with "Processing" status
        const patient = new Patient({ ...req.body, status: 'Processing' });
        await patient.save();

        // 2. Call ML service for triage prediction
        try {
            const mlPayload = {
                age: patient.age || 30,
                sex: patient.gender === 'Male' ? 1 : 2,
                heart_rate: patient.vitals?.heartRate || 80,
                temp: patient.vitals?.temp || 36.5,
                bp_systolic: patient.vitals?.bpSystolic || 120,
                bp_diastolic: patient.vitals?.bpDiastolic || 80,
                o2_sat: patient.vitals?.o2Sat || 98,
                respiratory_rate: 18,
                pain_score: 0,
                mental: 1,
                chief_complaint: patient.symptoms?.[0] || 'other'
            };

            const mlResponse = await axios.post(ML_SERVICE_URL, mlPayload, { timeout: 5000 });
            const { triage_score, triage_label, confidence, probabilities } = mlResponse.data;

            // 3. Update patient with triage results
            patient.triageScore = triage_score;
            patient.status = 'Triaged';
            patient.aiReasoning = [
                `Triage Level: ESI ${triage_score} (${triage_label})`,
                `Confidence: ${(confidence * 100).toFixed(1)}%`,
                ...Object.entries(probabilities).map(
                    ([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`
                )
            ];
            await patient.save();

            console.log(`✅ Triaged: ${patient.name} → ESI ${triage_score} (${triage_label}, ${(confidence * 100).toFixed(0)}%)`);
        } catch (mlErr) {
            // ML service unavailable — patient stays as "Waiting" with score 0
            patient.status = 'Waiting';
            patient.aiReasoning = ['ML service unavailable — manual triage required'];
            await patient.save();
            console.log(`⚠ ML unavailable for ${patient.name}: ${mlErr.message}`);
        }

        res.status(201).json(patient);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/patients/:id — get single patient
router.get('/:id', async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/patients/:id — update a patient
router.put('/:id', async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        res.json(patient);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/patients/:id — delete a patient
router.delete('/:id', async (req, res) => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        res.json({ message: 'Patient deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
