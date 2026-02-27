const fs = require('fs');
const path = require('path');
const http = require('http');

// ── Config ─────────────────────────────────────────────
const API_URL = 'http://localhost:3000/api/patients';
const INTERVAL_MS = 3000; // New patient every 3 seconds
const CSV_PATH = path.join(__dirname, '..', 'ml-service', 'data', 'data.csv');

// ── Load CSV ───────────────────────────────────────────
function loadPatients() {
    const raw = fs.readFileSync(CSV_PATH, 'latin1');
    const lines = raw.split('\n').filter(l => l.trim());
    const headers = lines[0].split(';');

    const patients = [];
    for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(';');
        if (vals.length < headers.length) continue;

        const get = (col) => {
            const idx = headers.indexOf(col);
            return idx >= 0 ? vals[idx].trim() : null;
        };

        const parseNum = (v) => {
            if (!v || v === '') return null;
            return parseFloat(v.replace(',', '.'));
        };

        const names = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Rohan', 'Divya', 'Kiran', 'Meera',
            'Arjun', 'Nisha', 'Sanjay', 'Pooja', 'Ravi', 'Kavita', 'Suresh', 'Anjali', 'Deepak', 'Sunita'];
        const surnames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Joshi', 'Mehta', 'Das', 'Reddy'];

        patients.push({
            name: names[Math.floor(Math.random() * names.length)] + ' ' +
                surnames[Math.floor(Math.random() * surnames.length)],
            age: parseInt(get('Age')) || 30,
            gender: get('Sex') === '1' ? 'Male' : 'Female',
            symptoms: [get('Chief_complain') || 'Unknown'].filter(Boolean),
            vitals: {
                heartRate: parseNum(get('HR')),
                temp: parseNum(get('BT')),
                bpSystolic: parseNum(get('SBP')),
                bpDiastolic: parseNum(get('DBP')),
                o2Sat: parseNum(get('Saturation')),
            }
        });
    }

    console.log(`Loaded ${patients.length} patient records from CSV`);
    return patients;
}

// ── POST patient ───────────────────────────────────────
function postPatient(patient) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(patient);
        const url = new URL(API_URL);

        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// ── Main loop ──────────────────────────────────────────
async function main() {
    const patients = loadPatients();
    let count = 0;

    console.log(`\n🏥 Patient Generator Started`);
    console.log(`   Posting to: ${API_URL}`);
    console.log(`   Interval: ${INTERVAL_MS / 1000}s\n`);

    const interval = setInterval(async () => {
        const patient = patients[Math.floor(Math.random() * patients.length)];
        try {
            const res = await postPatient(patient);
            count++;
            const vitals = `HR:${patient.vitals.heartRate || '?'} T:${patient.vitals.temp || '?'} BP:${patient.vitals.bpSystolic || '?'}/${patient.vitals.bpDiastolic || '?'}`;
            console.log(`[${count}] ${patient.name} (${patient.age}/${patient.gender}) | ${patient.symptoms[0]} | ${vitals} | Status: ${res.status}`);
        } catch (err) {
            console.error(`[ERROR] ${err.message}`);
        }
    }, INTERVAL_MS);

    // Graceful shutdown
    process.on('SIGINT', () => {
        clearInterval(interval);
        console.log(`\n\n✅ Generator stopped. ${count} patients admitted.`);
        process.exit(0);
    });
}

main();
