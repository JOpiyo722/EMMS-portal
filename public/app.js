document.addEventListener('DOMContentLoaded', () => {
    // Navigation Routing System
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view-panel');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            btn.classList.add('active');
            const targetView = document.getElementById(btn.getAttribute('data-target'));
            targetView.classList.add('active');

            // Route action triggering hooks
            if (btn.id === 'load-dashboard-btn') fetchLogs();
            if (btn.id === 'load-reports-btn') fetchReports();
        });
    });

    // Hardware Simulation Interactivity Handlers
    const hwStatus = document.getElementById('hardware-status-display');
    const radioClear = document.getElementById('radio-clear');
    const radioBeep = document.getElementById('radio-beep');
    const conditionalSection = document.getElementById('malpractice-details');

    document.getElementById('sim-clear-btn').addEventListener('click', () => {
        hwStatus.textContent = "🟢 CLEAR (No Device)";
        hwStatus.className = "hardware-status status-clear";
        radioClear.checked = true;
        conditionalSection.classList.add('hidden');
    });

    document.getElementById('sim-beep-btn').addEventListener('click', () => {
        hwStatus.textContent = "🚨 BEEP! (Device Flagged)";
        hwStatus.className = "hardware-status status-beep";
        radioBeep.checked = true;
        conditionalSection.classList.remove('hidden');
    });

    // Toggle conditional block when manually clicking form radio selectors
    radioClear.addEventListener('change', () => conditionalSection.classList.add('hidden'));
    radioBeep.addEventListener('change', () => conditionalSection.classList.remove('hidden'));

    // Handle Form Processing Submission Pipeline (F1 + F2)
    const form = document.getElementById('screening-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            invigilatorId: document.getElementById('invigilatorId').value,
            studentName: document.getElementById('studentName').value,
            regNo: document.getElementById('regNo').value,
            unitCode: document.getElementById('unitCode').value.toUpperCase(),
            scanResult: document.querySelector('input[name="scanResult"]:checked').value,
            deviceLocation: document.getElementById('deviceLocation').value,
            confiscated: document.getElementById('confiscated').value
        };

        try {
            const response = await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("Log processed and safely locked to persistent storage registry!");
                form.reset();
                conditionalSection.classList.add('hidden');
                hwStatus.textContent = "READY TO SCAN";
                hwStatus.className = "hardware-status";
            } else {
                const errorData = await response.json();
                alert("System error tracking entry: " + errorData.error);
            }
        } catch (error) {
            console.error("Networking error context:", error);
            alert("Connection lost. Unable to contact core database.");
        }
    });

    // Populate F3 Logs Registry Dashboard View
    let cacheLogs = [];
    async function fetchLogs() {
        try {
            const response = await fetch('/api/logs');
            cacheLogs = await response.json();
            renderTable(cacheLogs);
        } catch (error) {
            console.error("Dashboard pull error:", error);
        }
    }

    function renderTable(data) {
        const tbody = document.getElementById('logs-table-body');
        tbody.innerHTML = data.map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</td>
                <td><strong>${log.regNo}</strong></td>
                <td>${log.studentName}</td>
                <td>${log.unitCode}</td>
                <td><span class="badge ${log.scanResult.toLowerCase()}">${log.scanResult === 'CLEAR' ? '🟢 CLEAR' : '🔴 BEEP'}</span></td>
                <td>${log.scanResult === 'BEEP' ? `${log.deviceLocation} (Confiscated: ${log.confiscated})` : '—'}</td>
                <td><code>${log.invigilatorId}</code></td>
            </tr>
        `).join('');
    }

    // Client-side quick filter tool inside the dashboard
    document.getElementById('search-input').addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        const filtered = cacheLogs.filter(log => 
            log.studentName.toLowerCase().includes(value) ||
            log.regNo.toLowerCase().includes(value) ||
            log.unitCode.toLowerCase().includes(value)
        );
        renderTable(filtered);
    });

    // Populate F4 Report Metrics View
    async function fetchReports() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();

            document.getElementById('stat-total').textContent = stats.totalScreened;
            document.getElementById('stat-cleared').textContent = stats.totalCleared;
            document.getElementById('stat-incidents').textContent = stats.totalIncidents;

            const tbody = document.getElementById('reports-table-body');
            tbody.innerHTML = Object.keys(stats.byUnit).map(unit => {
                const item = stats.byUnit[unit];
                const integrityRate = item.total > 0 ? (((item.total - item.incidents) / item.total) * 100).toFixed(1) : 100;
                return `
                    <tr>
                        <td><strong>${unit}</strong></td>
                        <td>${item.total}</td>
                        <td><span class="${item.incidents > 0 ? 'text-danger' : ''}">${item.incidents}</span></td>
                        <td><strong>${integrityRate}%</strong></td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error("Reports pull error:", error);
        }
    });
});
