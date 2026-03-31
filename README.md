# DataCenter-ResourceCalc

A quick resource/IOPS calculator for the Data Center game. Define multiple server type requirements with their IOPS targets, and the system automatically calculates the optimal combination of 1U and 2U servers needed for each type, displayed side-by-side.

## Features

- **Multiple Requirements**: Add multiple server types at once (System X, RISC, Mainframe, GPU) each with their own IOPS targets
- **Smart Optimization**: 
  - Maximizes 2U server usage for space efficiency (provides 12,000 IOPS each)
  - Supplements with 1U servers when needed (provides 5,000 IOPS each)
  - Automatically calculates exact or minimal-overage combinations
- **Port Count**: Automatically calculates ports required (1 port per server)
- **Total Aggregation**: See combined totals across all requirements

## How to Use

1. **Add Server Requirements**: 
   - Select a server type (System X, RISC, Mainframe, or GPU)
   - Enter target IOPS
   - Click "Add Requirement"
   - Repeat for additional types

2. **Calculate Solutions**:
   - Click "Calculate All Solutions"

3. **View Results**:
   - Each server type shows in its own card with:
     - Number of 2U and 1U servers needed
     - Total servers and ports required
     - Rack space needed
     - Total IOPS provisioned
     - Match status (exact or overage)
   - **Total Summary** shows combined numbers across all types

## Optimization Logic

The calculator uses a space-efficient algorithm for each requirement:

1. **For targets < 12,000 IOPS**: Uses only 1U servers
2. **For targets ≥ 12,000 IOPS**: 
   - Fills as much as possible with 2U servers first (12,000 IOPS each)
   - Adds 1U servers (5,000 IOPS each) to cover any remaining IOPS needed
3. **Result**: Always minimizes rack space while meeting or slightly exceeding IOPS target

### Example Calculations

- Target: 5,000 IOPS → 1× 1U server → 1 port
- Target: 12,000 IOPS → 1× 2U server → 1 port
- Target: 17,000 IOPS → 1× 2U + 1× 1U (total: 17,000 IOPS) → 2 ports
- Target: 30,000 IOPS → needs 2× 2U + 2× 1U (total: 34,000 IOPS) → 4 ports

### Port Counting
- 1 port required per server, regardless of size (1U or 2U)
- Total ports = 2U servers + 1U servers

## Server Specifications

All server types (System X, RISC, Mainframe, GPU) have the same IOPS capabilities:
- **1U Server**: 5,000 IOPS, 1U of rack space, 1 port
- **2U Server**: 12,000 IOPS, 2U of rack space, 1 port

## License

See LICENSE file for details.