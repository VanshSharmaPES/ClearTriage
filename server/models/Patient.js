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
    status: { type: String, default: 'Waiting' },
    entryTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', PatientSchema);
