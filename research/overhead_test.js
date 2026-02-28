/**
 * AI Overhead Test
 * Compares Node-only vs Node+AI response times
 * Answers: "Does the AI make the system too slow?"
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/patients';
const NUM_REQUESTS = 50;

const PATIENT_BODY = JSON.stringify({
    name: 'Overhead Test Patient',
    age: 55,
    gender: 'Female',
    symptoms: ['Shortness of Breath'],
    vitals: { heartRate: 100, temp: 38.0, bpSystolic: 110, bpDiastolic: 70, o2Sat: 93 }
});

function sendRequest() {
    return new Promise((resolve, reject) => {
        const start = process.hrtime.bigint();
        const url = new URL(API_URL);

        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(PATIENT_BODY),
            }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                const elapsed = Number(process.hrtime.bigint() - start) / 1e6; // ms
                let parsed;
                try { parsed = JSON.parse(body); } catch { parsed = {}; }
                resolve({
                    latency: elapsed,
                    status: res.statusCode,
                    triageScore: parsed.triageScore || 0,
                    aiStatus: parsed.status || 'unknown',
                });
            });
        });

        req.on('error', reject);
        req.write(PATIENT_BODY);
        req.end();
    });
}

async function runBatch(label) {
    console.log(`\n🔬 Running ${label}: ${NUM_REQUESTS} sequential requests...`);
    const latencies = [];

    for (let i = 0; i < NUM_REQUESTS; i++) {
        const result = await sendRequest();
        latencies.push(result.latency);
        const bar = '█'.repeat(Math.min(50, Math.round(result.latency / 10)));
        process.stdout.write(`  [${String(i + 1).padStart(3)}] ${result.latency.toFixed(1).padStart(8)}ms ${bar} (${result.aiStatus})\n`);
    }

    latencies.sort((a, b) => a - b);
    return {
        label,
        count: NUM_REQUESTS,
        avg: latencies.reduce((a, b) => a + b) / latencies.length,
        median: latencies[Math.floor(latencies.length / 2)],
        p95: latencies[Math.floor(latencies.length * 0.95)],
        p99: latencies[Math.floor(latencies.length * 0.99)],
        min: latencies[0],
        max: latencies[latencies.length - 1],
    };
}

async function main() {
    console.log('🧪 ClearTriage AI Overhead Test');
    console.log('================================');
    console.log('');
    console.log('⚠ INSTRUCTIONS:');
    console.log('  Test A: Start server WITHOUT ML service (stop ml-service, keep Express)');
    console.log('  Test B: Start ALL services including ML (npm run dev)');
    console.log('');
    console.log('  Run this script TWICE — once for each scenario.');
    console.log('  Results are appended to overhead_results.json');
    console.log('');

    const testLabel = process.argv[2] || 'unknown';
    if (!['node-only', 'node-ai'].includes(testLabel)) {
        console.log('Usage: node overhead_test.js [node-only|node-ai]');
        console.log('  node-only = Express server only (no ML service)');
        console.log('  node-ai   = Full stack with ML + SHAP prediction');
        process.exit(1);
    }

    const result = await runBatch(testLabel);

    console.log(`\n📋 ${testLabel.toUpperCase()} Results:`);
    console.log(`   Avg:    ${result.avg.toFixed(1)}ms`);
    console.log(`   Median: ${result.median.toFixed(1)}ms`);
    console.log(`   P95:    ${result.p95.toFixed(1)}ms`);
    console.log(`   Min:    ${result.min.toFixed(1)}ms`);
    console.log(`   Max:    ${result.max.toFixed(1)}ms`);

    // Load or create results file
    const outPath = path.join(__dirname, 'overhead_results.json');
    let allResults = {};
    if (fs.existsSync(outPath)) {
        allResults = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    }
    allResults[testLabel] = result;

    // If both tests done, calculate overhead
    if (allResults['node-only'] && allResults['node-ai']) {
        const nodeOnly = allResults['node-only'].avg;
        const nodeAi = allResults['node-ai'].avg;
        const overhead = nodeAi - nodeOnly;
        const overheadPct = (overhead / nodeOnly) * 100;

        allResults.comparison = {
            nodeOnlyAvg: nodeOnly,
            nodeAiAvg: nodeAi,
            aiOverheadMs: overhead,
            aiOverheadPercent: overheadPct,
            acceptable: overhead < 200, // <200ms = clinically acceptable
        };

        console.log(`\n${'='.repeat(50)}`);
        console.log('📊 AI OVERHEAD COMPARISON');
        console.log(`${'='.repeat(50)}`);
        console.log(`   Node-only avg:  ${nodeOnly.toFixed(1)}ms`);
        console.log(`   Node+AI avg:    ${nodeAi.toFixed(1)}ms`);
        console.log(`   AI overhead:    +${overhead.toFixed(1)}ms (+${overheadPct.toFixed(1)}%)`);
        console.log(`   Acceptable:     ${overhead < 200 ? '✅ YES (<200ms)' : '⚠ NO (≥200ms)'}`);
    }

    fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
    console.log(`\n💾 Results saved to ${outPath}`);
}

main().catch(console.error);
