const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    name: String,
    age: Number,
    gender: String,
    symptoms: [String],
    vitals: {
        heartRate: Number,
        temp: Number,
        bpSystolic: Number,
        bpDiastolic: Number,
        o2Sat: Number
    },
    triageScore: { type: Number, default: 0 },
    aiReasoning: [String],
    shapDetails: { type: Array, default: [] },
    whyText: { type: String, default: '' },
    overrideScore: { type: Number, default: null },
    overrideReason: { type: String, default: null },
    status: { type: String, default: 'Waiting' },
    entryTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', PatientSchema);
