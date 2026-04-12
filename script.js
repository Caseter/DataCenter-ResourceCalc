// IOPS Calculator for DataCenter game
class IOPSCalculator {
    constructor() {
        this.bandwidthGbps7U = 0.6;
        this.bandwidthGbps3U = 0.25;

        // Define server types with their IOPS values
        this.serverTypes = {
            'System X': { name: 'System X', iops_3u: 5000, iops_7u: 12000, cost_3u: 400, cost_7u: 1600 },
            'RISC': { name: 'RISC', iops_3u: 5000, iops_7u: 12000, cost_3u: 450, cost_7u: 1750 },
            'Mainframe': { name: 'Mainframe', iops_3u: 5000, iops_7u: 12000, cost_3u: 850, cost_7u: 2000 },
            'GPU': { name: 'GPU', iops_3u: 5000, iops_7u: 12000, cost_3u: 550, cost_7u: 2200 }
        };

        this.requirements = [];
        this.initializeEventListeners();
    }

    addRequirement(serverType, targetIops) {
        if (!serverType) {
            alert('Please select a server type');
            return;
        }

        if (!targetIops || targetIops <= 0) {
            alert('Please enter a target IOPS greater than 0');
            return;
        }

        const reqId = Date.now();
        this.requirements.push({
            id: reqId,
            type: serverType,
            iops: parseFloat(targetIops)
        });

        this.renderRequirements();
        this.clearRequirementForm();
    }

    removeRequirement(reqId) {
        this.requirements = this.requirements.filter(r => r.id !== reqId);
        this.renderRequirements();
    }

    clearRequirementForm() {
        document.getElementById('serverTypeSelect').value = '';
        document.getElementById('requirementIops').value = '';
    }

    renderRequirements() {
        const requirementsList = document.getElementById('requirementsList');

        if (this.requirements.length === 0) {
            requirementsList.innerHTML = '';
            return;
        }

        requirementsList.innerHTML = this.requirements.map(req => `
            <div class="requirement-item">
                <div class="requirement-item-info">
                    <div class="requirement-item-type">${this.escapeHtml(req.type)}</div>
                    <div class="requirement-item-iops">Target: <strong>${req.iops.toLocaleString()}</strong> IOPS</div>
                </div>
                <button class="btn btn-danger requirement-item-remove" onclick="calculator.removeRequirement(${req.id})">✕</button>
            </div>
        `).join('');
    }

    calculateOptimal(serverType, targetIops) {
        const server = this.serverTypes[serverType];
        if (!server) {
            return null;
        }

        // If target is less than 12k IOPS, use 3U servers only
        if (targetIops < 12000) {
            const count3U = Math.ceil(targetIops / 5000);
            const count7U = 0;
            const cost3U = count3U * server.cost_3u;
            return {
                type: serverType,
                count7U,
                count3U,
                totalIops: count3U * server.iops_3u,
                totalRackSpace: count3U * 3,
                totalPorts: count3U,
                totalBandwidthGbps: count7U * this.bandwidthGbps7U + count3U * this.bandwidthGbps3U,
                cost3U: cost3U,
                cost7U: 0,
                totalCost: cost3U,
                isExact: (count3U * server.iops_3u === targetIops),
                exceeded: (count3U * server.iops_3u > targetIops)
            };
        }

        // For targets >= 12k, maximize 7U usage first
        const count7U = Math.floor(targetIops / 12000);
        const remainingIops = targetIops - (count7U * 12000);

        // Add 3U servers to cover remaining IOPS
        const count3U = Math.ceil(remainingIops / 5000);
        const totalPorts = count7U + count3U;
        const cost7U = count7U * server.cost_7u;
        const cost3U = count3U * server.cost_3u;
        const totalCost = cost7U + cost3U;

        return {
            type: serverType,
            count7U: count7U,
            count3U: count3U,
            totalIops: (count7U * server.iops_7u) + (count3U * server.iops_3u),
            totalRackSpace: (count7U * 7) + (count3U * 3),
            totalPorts: totalPorts,
            totalBandwidthGbps: count7U * this.bandwidthGbps7U + count3U * this.bandwidthGbps3U,
            cost3U: cost3U,
            cost7U: cost7U,
            totalCost: totalCost,
            isExact: ((count7U * server.iops_7u) + (count3U * server.iops_3u) === targetIops),
            exceeded: ((count7U * server.iops_7u) + (count3U * server.iops_3u) > targetIops)
        };
    }

    displayResults() {
        const resultsDiv = document.getElementById('results');
        const resultsContainer = document.getElementById('results');

        if (this.requirements.length === 0) {
            resultsDiv.style.display = 'none';
            return;
        }

        // Calculate all solutions
        const solutions = this.requirements.map(req => ({
            ...req,
            solution: this.calculateOptimal(req.type, req.iops)
        }));

        // Build result cards
        const resultsHTML = solutions.map(sol => {
            const solutionItems = `
                ${sol.solution.count7U > 0 ? `
                <div class="solution-item">
                    <div class="solution-item-name">${this.escapeHtml(sol.solution.type)} - 7U</div>
                    <div class="solution-item-count">${sol.solution.count7U}</div>
                </div>
                ` : ''}
                ${sol.solution.count3U > 0 ? `
                <div class="solution-item">
                    <div class="solution-item-name">${this.escapeHtml(sol.solution.type)} - 3U</div>
                    <div class="solution-item-count">${sol.solution.count3U}</div>
                </div>
                ` : ''}
            `;

            const matchStatus = sol.solution.isExact 
                ? '<div class="match-status exact">✓ Exact Match</div>'
                : `<div class="match-status exceeded">⚠ +${(sol.solution.totalIops - sol.iops).toLocaleString()} IOPS</div>`;

            return `
            <div class="result-card">
                <div class="result-card-title">${this.escapeHtml(sol.type)}</div>
                <div class="solution-items">
                    ${solutionItems}
                </div>
                <div class="results-summary">
                    <div class="summary-row">
                        <span>7U:</span>
                        <strong>${sol.solution.count7U}</strong>
                    </div>
                    <div class="summary-row">
                        <span>3U:</span>
                        <strong>${sol.solution.count3U}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Total Servers:</span>
                        <strong>${sol.solution.count7U + sol.solution.count3U}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Ports:</span>
                        <strong>${sol.solution.totalPorts}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Bandwidth:</span>
                        <strong>${sol.solution.totalBandwidthGbps.toFixed(2)} Gbps</strong>
                    </div>
                    <div class="summary-row">
                        <span>Rack Space:</span>
                        <strong>${sol.solution.totalRackSpace} U</strong>
                    </div>
                    <div class="summary-row">
                        <span>Total IOPS:</span>
                        <strong>${sol.solution.totalIops.toLocaleString()}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Cost (3U):</span>
                        <strong>$${sol.solution.cost3U.toLocaleString()}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Cost (7U):</span>
                        <strong>$${sol.solution.cost7U.toLocaleString()}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Total Cost:</span>
                        <strong>$${sol.solution.totalCost.toLocaleString()}</strong>
                    </div>
                </div>
                ${matchStatus}
            </div>
            `;
        }).join('');

        document.getElementById('resultsSolutions').innerHTML = resultsHTML;

        // Calculate and display totals
        const totals = {
            count7U: 0,
            count3U: 0,
            ports: 0,
            bandwidthGbps: 0,
            rackSpace: 0,
            cost: 0
        };

        solutions.forEach(sol => {
            totals.count7U += sol.solution.count7U;
            totals.count3U += sol.solution.count3U;
            totals.ports += sol.solution.totalPorts;
            totals.bandwidthGbps += sol.solution.totalBandwidthGbps;
            totals.rackSpace += sol.solution.totalRackSpace;
            totals.cost += sol.solution.totalCost;
        });

        const totalServers = totals.count7U + totals.count3U;
        document.getElementById('totalCount7U').textContent = totals.count7U;
        document.getElementById('totalCount3U').textContent = totals.count3U;
        document.getElementById('totalAllServers').textContent = totalServers;
        document.getElementById('totalPorts').textContent = totals.ports;
        document.getElementById('totalBandwidth').textContent = `${totals.bandwidthGbps.toFixed(2)} Gbps`;
        document.getElementById('totalRack').textContent = `${totals.rackSpace} U`;
        document.getElementById('totalCost').textContent = `$${totals.cost.toLocaleString()}`;

        document.getElementById('totalsSummary').style.display = 'block';
        resultsContainer.style.display = 'block';
    }

    initializeEventListeners() {
        document.getElementById('addRequirementBtn').addEventListener('click', () => {
            const serverType = document.getElementById('serverTypeSelect').value;
            const targetIops = document.getElementById('requirementIops').value;

            this.addRequirement(serverType, targetIops);
        });

        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.displayResults();
        });

        // Allow Enter key to trigger adding requirement
        document.getElementById('requirementIops').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('addRequirementBtn').click();
            }
        });
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize calculator on page load
let calculator;
document.addEventListener('DOMContentLoaded', () => {
    calculator = new IOPSCalculator();
});

