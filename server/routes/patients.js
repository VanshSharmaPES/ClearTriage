const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

// GET /api/patients — list all patients (newest first)
router.get('/', async (req, res) => {
    try {
        const patients = await Patient.find().sort({ entryTime: -1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/patients — create a new patient
router.post('/', async (req, res) => {
    try {
        const patient = new Patient(req.body);
        const saved = await patient.save();
        res.status(201).json(saved);
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
