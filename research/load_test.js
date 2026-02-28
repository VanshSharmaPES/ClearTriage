/**
 * Load Test — Scalability Analysis
 * Tests POST /api/patients at 100, 500, 1000 concurrent connections
 * Generates data for "Graph 1: Response Time vs Number of Users"
 */
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/patients';
const DURATION = 30; // seconds per tier
const TIERS = [100, 500, 1000];

const PATIENT_BODY = JSON.stringify({
    name: 'Load Test Patient',
    age: 45,
    gender: 'Male',
    symptoms: ['Chest Pain'],
    vitals: { heartRate: 90, temp: 37.0, bpSystolic: 130, bpDiastolic: 85, o2Sat: 96 }
});

async function runTier(connections) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔥 Testing ${connections} concurrent connections for ${DURATION}s`);
    console.log(`${'='.repeat(50)}`);

    return new Promise((resolve, reject) => {
        const instance = autocannon({
            url: API_URL,
            connections,
            duration: DURATION,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: PATIENT_BODY,
        }, (err, result) => {
            if (err) return reject(err);
            resolve({
                connections,
                duration: DURATION,
                totalRequests: result.requests.total,
                avgLatency: result.latency.average,
                p50Latency: result.latency.p50,
                p99Latency: result.latency.p99,
                maxLatency: result.latency.max,
                requestsPerSec: result.requests.average,
                throughputMBps: (result.throughput.average / 1024 / 1024).toFixed(2),
                errors: result.errors,
                timeouts: result.timeouts,
                non2xx: result.non2xx,
            });
        });

        autocannon.track(instance, { renderProgressBar: true });
    });
}

async function main() {
    console.log('📊 ClearTriage Scalability Test');
    console.log(`   Target: ${API_URL}`);
    console.log(`   Tiers: ${TIERS.join(', ')} connections\n`);

    const results = [];

    for (const tier of TIERS) {
        const result = await runTier(tier);
        results.push(result);

        console.log(`\n📋 Results for ${tier} connections:`);
        console.log(`   Avg Latency:    ${result.avgLatency.toFixed(1)}ms`);
        console.log(`   P99 Latency:    ${result.p99Latency}ms`);
        console.log(`   Requests/sec:   ${result.requestsPerSec.toFixed(1)}`);
        console.log(`   Total Requests: ${result.totalRequests}`);
        console.log(`   Errors:         ${result.errors}`);

        // Small cooldown between tiers
        if (tier !== TIERS[TIERS.length - 1]) {
            console.log('\n⏳ Cooling down 5s...');
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    // Save results
    const outPath = path.join(__dirname, 'scalability_results.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to ${outPath}`);

    // Summary table
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SCALABILITY SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`${'Connections'.padEnd(15)} ${'Avg(ms)'.padEnd(10)} ${'P99(ms)'.padEnd(10)} ${'Req/s'.padEnd(10)} Errors`);
    console.log('-'.repeat(60));
    for (const r of results) {
        console.log(
            `${String(r.connections).padEnd(15)} ${r.avgLatency.toFixed(1).padEnd(10)} ${String(r.p99Latency).padEnd(10)} ${r.requestsPerSec.toFixed(1).padEnd(10)} ${r.errors}`
        );
    }
}

main().catch(console.error);
