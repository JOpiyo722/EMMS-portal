
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'logs.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Read logs
const readLogs = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];

        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');

    } catch (error) {
        console.error('Error reading log file:', error);
        return [];
    }
};

// Helper: Write logs
const writeLogs = (logs) => {
    try {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(logs, null, 2),
            'utf8'
        );
        return true;

    } catch (error) {
        console.error('Error writing log file:', error);
        return false;
    }
};

// API: Save screening incident
app.post('/api/logs', (req, res) => {

    const {
        studentName,
        regNo,
        unitCode,
        scanResult,
        deviceLocation,
        confiscated,
        invigilatorId
    } = req.body;

    // Validate required fields
    if (!studentName || !regNo || !unitCode ||
        !scanResult || !invigilatorId) {

        return res.status(400).json({
            error: 'Missing required screening details.'
        });
    }

    // Validate scan result
    if (!['CLEAR', 'BEEP'].includes(scanResult)) {
        return res.status(400).json({
            error: 'Invalid scan result.'
        });
    }

    const logs = readLogs();

    const newLog = {
        id: 'LOG-' + Date.now(),
        studentName,
        regNo,
        unitCode,
        scanResult,
        deviceLocation: scanResult === 'BEEP'
            ? deviceLocation
            : 'N/A',
        confiscated: scanResult === 'BEEP'
            ? confiscated
            : 'N/A',
        invigilatorId,
        timestamp: new Date().toISOString()
    };

    logs.unshift(newLog);

    // Save to database file
    if (!writeLogs(logs)) {
        return res.status(500).json({
            error: 'Failed to save screening log.'
        });
    }

    return res.status(201).json({
        message: 'Screening logged successfully!',
        log: newLog
    });
});

// API: Get all logs
app.get('/api/logs', (req, res) => {
    res.json(readLogs());
});

// API: Get summary statistics
app.get('/api/stats', (req, res) => {

    const logs = readLogs();

    const stats = {
        totalScreened: logs.length,

        totalCleared: logs.filter(
            log => log.scanResult === 'CLEAR'
        ).length,

        totalIncidents: logs.filter(
            log => log.scanResult === 'BEEP'
        ).length,

        byUnit: {}
    };

    logs.forEach(log => {

        if (!stats.byUnit[log.unitCode]) {
            stats.byUnit[log.unitCode] = {
                total: 0,
                incidents: 0
            };
        }

        stats.byUnit[log.unitCode].total++;

        if (log.scanResult === 'BEEP') {
            stats.byUnit[log.unitCode].incidents++;
        }
    });

    res.json(stats);
});

// Fallback: Serve React / SPA frontend
// Using middleware avoids Express wildcard route errors.
app.use((req, res, next) => {

    if (req.method !== 'GET') {
        return next();
    }

    res.sendFile(
        path.join(__dirname, 'public', 'index.html'),
        (error) => {
            if (error) {
                console.error('Frontend loading error:', error);
                if (!res.headersSent) {
                    res.status(500).send('Frontend could not be loaded.');
                }
            }
        }
    );
});

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found.'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('====================================');
    console.log(' EMMS EXAMINATION INTEGRITY SYSTEM');
    console.log('====================================');
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Press CTRL + C to stop the server.');
});
