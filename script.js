// IOPS Calculator for DataCenter game
class IOPSCalculator {
    constructor() {
        // Define server types with their IOPS values
        this.serverTypes = {
            'System X': { name: 'System X', iops_1u: 5000, iops_2u: 12000 },
            'RISC': { name: 'RISC', iops_1u: 5000, iops_2u: 12000 },
            'Mainframe': { name: 'Mainframe', iops_1u: 5000, iops_2u: 12000 },
            'GPU': { name: 'GPU', iops_1u: 5000, iops_2u: 12000 }
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

        // If target is less than 12k IOPS, use 1U servers only
        if (targetIops < 12000) {
            const count1U = Math.ceil(targetIops / 5000);
            return {
                type: serverType,
                count2U: 0,
                count1U: count1U,
                totalIops: count1U * 5000,
                totalRackSpace: count1U * 1,
                totalPorts: count1U,
                isExact: (count1U * 5000 === targetIops),
                exceeded: (count1U * 5000 > targetIops)
            };
        }

        // For targets >= 12k, maximize 2U usage first
        const count2U = Math.floor(targetIops / 12000);
        const remainingIops = targetIops - (count2U * 12000);

        // Add 1U servers to cover remaining IOPS
        const count1U = Math.ceil(remainingIops / 5000);
        const totalPorts = count2U + count1U;

        return {
            type: serverType,
            count2U: count2U,
            count1U: count1U,
            totalIops: (count2U * 12000) + (count1U * 5000),
            totalRackSpace: (count2U * 2) + (count1U * 1),
            totalPorts: totalPorts,
            isExact: ((count2U * 12000) + (count1U * 5000) === targetIops),
            exceeded: ((count2U * 12000) + (count1U * 5000) > targetIops)
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
                ${sol.solution.count2U > 0 ? `
                <div class="solution-item">
                    <div class="solution-item-name">${this.escapeHtml(sol.solution.type)} - 2U</div>
                    <div class="solution-item-count">${sol.solution.count2U}</div>
                </div>
                ` : ''}
                ${sol.solution.count1U > 0 ? `
                <div class="solution-item">
                    <div class="solution-item-name">${this.escapeHtml(sol.solution.type)} - 1U</div>
                    <div class="solution-item-count">${sol.solution.count1U}</div>
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
                        <span>2U:</span>
                        <strong>${sol.solution.count2U}</strong>
                    </div>
                    <div class="summary-row">
                        <span>1U:</span>
                        <strong>${sol.solution.count1U}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Total Servers:</span>
                        <strong>${sol.solution.count2U + sol.solution.count1U}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Ports:</span>
                        <strong>${sol.solution.totalPorts}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Rack Space:</span>
                        <strong>${sol.solution.totalRackSpace} U</strong>
                    </div>
                    <div class="summary-row">
                        <span>Total IOPS:</span>
                        <strong>${sol.solution.totalIops.toLocaleString()}</strong>
                    </div>
                </div>
                ${matchStatus}
            </div>
            `;
        }).join('');

        document.getElementById('resultsSolutions').innerHTML = resultsHTML;

        // Calculate and display totals
        const totals = {
            count2U: 0,
            count1U: 0,
            ports: 0,
            rackSpace: 0
        };

        solutions.forEach(sol => {
            totals.count2U += sol.solution.count2U;
            totals.count1U += sol.solution.count1U;
            totals.ports += sol.solution.totalPorts;
            totals.rackSpace += sol.solution.totalRackSpace;
        });

        const totalServers = totals.count2U + totals.count1U;
        document.getElementById('totalCount2U').textContent = totals.count2U;
        document.getElementById('totalCount1U').textContent = totals.count1U;
        document.getElementById('totalAllServers').textContent = totalServers;
        document.getElementById('totalPorts').textContent = totals.ports;
        document.getElementById('totalRack').textContent = `${totals.rackSpace} U`;

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

