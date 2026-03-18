const mongoose = require('mongoose');

// Need to match the same connection as server
mongoose.connect('mongodb://localhost:27017/glass_box_triage');

const Patient = require('./models/Patient');

async function createOverrides() {
    console.log("Adding mock overrides...");
    
    // Create an override where score should have been ESI 1
    const p1 = new Patient({
        name: "Test Override Patient",
        age: 65,
        gender: "Male",
        symptoms: ["chest pain"],
        vitals: {
            heartRate: 120,
            temp: 37,
            bpSystolic: 180,
            bpDiastolic: 100,
            o2Sat: 92
        },
        triageScore: 3, // AI guessed 3
        overrideScore: 1, // Human said 1
        overrideReason: "Severely hypoxemic and hypertensive, risk of acute MI"
    });
    
    await p1.save();
    console.log("Mock override saved.");
    process.exit(0);
}

createOverrides();