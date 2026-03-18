const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Apply authentication to all reports routes
router.use(authenticate);

// Helper function to format CSV fields
const escapeCSV = (str) => {
    if (str === null || str === undefined) return '';
    const stringified = String(str);
    if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return `"${stringified.replace(/"/g, '""')}"`;
    }
    return stringified;
};

// GET /api/reports/csv - Export all patient data as CSV
router.get('/csv', authorize('Admin', 'Doctor'), async (req, res) => {
    try {
        const patients = await Patient.find().sort({ entryTime: -1 });
        
        const headers = [
            'ID', 'Name', 'Age', 'Gender', 'Symptoms', 
            'HeartRate', 'Temp', 'BpSystolic', 'BpDiastolic', 'O2Sat',
            'AI_TriageScore', 'AI_WhyText', 'Human_OverrideScore', 'Human_OverrideReason', 
            'Final_Status', 'EntryTime'
        ];
        
        const rows = patients.map(p => [
            p._id.toString(),
            p.name,
            p.age,
            p.gender,
            (p.symptoms || []).join('; '),
            p.vitals?.heartRate,
            p.vitals?.temp,
            p.vitals?.bpSystolic,
            p.vitals?.bpDiastolic,
            p.vitals?.o2Sat,
            p.triageScore,
            p.whyText,
            p.overrideScore,
            p.overrideReason,
            p.status,
            p.entryTime ? new Date(p.entryTime).toISOString() : ''
        ].map(escapeCSV).join(','));
        
        const csvContent = [headers.join(','), ...rows].join('\n');
        
        res.header('Content-Type', 'text/csv');
        res.attachment(`triage_report_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/analytics - Triage summary and AI Confusion Matrix
router.get('/analytics', authorize('Admin', 'Doctor', 'Nurse'), async (req, res) => {
    try {
        const patients = await Patient.find({ status: { $ne: 'Waiting' } });
        
        let totalValids = 0;
        let correctAI = 0;
        
        // 5x5 Confusion Matrix: row=actual (1-5), col=predicted (1-5)
        // Note: 1=Immediate, 2=Emergent, 3=Urgent, 4=Less Urgent, 5=Non-Urgent
        const confusionMatrix = Array(5).fill(null).map(() => Array(5).fill(0));
        
        // Timeline array for weekly/monthly grouping
        // We'll just provide a simple day-by-day count for the last 30 days
        const distributionByLevel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const dailyCounts = {};

        patients.forEach(p => {
            const pred = p.triageScore;
            // If pred is 0, they weren't triaged yet
            if (pred < 1 || pred > 5) return;
            
            const actual = p.overrideScore || pred;
            
            if (pred === actual) correctAI++;
            totalValids++;
            
            // Build confusion matrix (0-indexed logic)
            if (actual >= 1 && actual <= 5 && pred >= 1 && pred <= 5) {
                confusionMatrix[actual - 1][pred - 1]++;
                distributionByLevel[actual]++;
            }

            const dateStr = p.entryTime ? new Date(p.entryTime).toISOString().split('T')[0] : 'Unknown';
            if (dateStr !== 'Unknown') {
                if (!dailyCounts[dateStr]) dailyCounts[dateStr] = 0;
                dailyCounts[dateStr]++;
            }
        });
        
        const accuracy = totalValids > 0 ? ((correctAI / totalValids) * 100).toFixed(2) : 0;
        
        res.json({
            totalTriaged: patients.length,
            aiAccuracyPercentage: Number(accuracy),
            confusionMatrix,
            distributionByLevel,
            dailyCounts
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;