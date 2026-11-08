const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Spin up test environmental configs
process.env.NODE_ENV = 'test';
const app = require('./server');
const DATA_FILE = path.join(__dirname, 'logs.json');

let server;
const TEST_PORT = 4500;

// Set up execution sandbox context container
function setup() {
    if (fs.existsSync(DATA_FILE)) {
        fs.unlinkSync(DATA_FILE); // Wipe existing database state for testing clean line logs
    }
    return new Promise((resolve) => {
        server = http.createServer(app).listen(TEST_PORT, () => {
            resolve();
        });
    });
}

// Tear down environments gracefully
function teardown() {
    return new Promise((resolve) => {
        server.close(() => {
            if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
            resolve();
        });
    });
}

// Request processing assistant
function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on('error', reject);
        if (postData) req.write(JSON.stringify(postData));
        req.end();
    });
}

// Master execution workflow array sequence
async function runTests() {
    console.log("🚀 Initializing EMMS Integration Test Protocol Runner...\n");
    await setup();

    try {
        // TEST 1: Validate database initial state setup pipeline mapping
        console.log("🔄 Test 1: Fetch Empty Log Entries Registry System...");
        const res1 = await makeRequest({ host: 'localhost', port: TEST_PORT, path: '/api/logs', method: 'GET' });
        assert.strictEqual(res1.status, 200);
        assert.strictEqual(JSON.parse(res1.body).length, 0);
        console.log("✅ Test 1 Passed successfully.\n");

        // TEST 2: Validate full functional incident registration sequence pipeline
        console.log("🔄 Test 2: Post an active Malpractice Device Logging Incident Entry Form...");
        const mockLog = {
            invigilatorId: "TEST-INV-1",
            studentName: "Alex Murimi",
            regNo: "BIT/0014/26",
            unitCode: "CCS 3102",
            scanResult: "BEEP",
            deviceLocation: "Pocket",
            confiscated: "Yes"
        };
        const res2 = await makeRequest({
            host: 'localhost', port: TEST_PORT, path: '/api/logs', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, mockLog);
        assert.strictEqual(res2.status, 201);
        const savedLog = JSON.parse(res2.body).log;
        assert.strictEqual(savedLog.studentName, "Alex Murimi");
        assert.strictEqual(savedLog.scanResult, "BEEP");
        console.log("✅ Test 2 Passed successfully.\n");

        // TEST 3: Check Lecturer Insights Metrics Engine Calculation Verification maps
        console.log("🔄 Test 3: Querying Lecturer Unit Analytics Breakdown Registry Context...");
        const res3 = await makeRequest({ host: 'localhost', port: TEST_PORT, path: '/api/stats', method: 'GET' });
        assert.strictEqual(res3.status, 200);
        const stats = JSON.parse(res3.body);
        assert.strictEqual(stats.totalScreened, 1);
        assert.strictEqual(stats.totalIncidents, 1);
        assert.strictEqual(stats.byUnit["CCS 3102"].total, 1);
        console.log("✅ Test 3 Passed successfully.\n");

        // TEST 4: Assert valid CSV file transmission protocol returns proper headers
        console.log("🔄 Test 4: Testing CSV file binary stream formatting generation components...");
        const res4 = await makeRequest({ host: 'localhost', port: TEST_PORT, path: '/api/logs/export', method: 'GET' });
        assert.strictEqual(res4.status, 200);
        assert.ok(res4.headers['content-type'].includes('text/csv'));
        assert.ok(res4.body.includes('Registration Number'));
        assert.ok(res4.body.includes('BIT/0014/26'));
        console.log("✅ Test 4 Passed successfully.\n");

        console.log("🎉 ALL EMMS CORE SYSTEMS AND EXPANDED FEATURES WORKING CRITICALLY STABLE!");
    } catch (error) {
        console.error("❌ TEST ENCOUNTERED AN EXCEPTION AND REJECTED TRACE:");
        console.error(error);
        process.exitCode = 1;
    } finally {
        await teardown();
    }
}

runTests();
