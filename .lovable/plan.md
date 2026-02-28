

# Add Privacy by Design & Default Principles

## Overview
Add a new assessment domain **O. Privacy by Design & Default** to the Rapid Assessment (Phase 3), covering the foundational PbD principles as they apply under the DPDP Act. This domain will integrate seamlessly into the existing 14-domain framework, making it 15 domains total.

## New Domain: O. Privacy by Design & Default

**Section Reference:** Sec 4(2), 8(1), Rule 6 | **Penalty:** Rs.50 Cr | **8 items:**

| ID | Description | Risk |
|----|-------------|------|
| O.1 | Proactive not Reactive — privacy risk assessments conducted before new processing, products, or systems | Critical |
| O.2 | Privacy as Default Setting — data collection limited to minimum by default; no user action required for maximum privacy | Critical |
| O.3 | Privacy Embedded into Design — privacy controls integrated into system architecture, not bolted on | High |
| O.4 | Full Functionality — positive-sum approach; privacy not traded off against functionality or security | Standard |
| O.5 | End-to-End Security — data protected throughout its entire lifecycle from collection to deletion | High |
| O.6 | Visibility and Transparency — processing activities are verifiable and auditable by data principals and regulators | High |
| O.7 | Respect for Data Principal — user-centric design with strong defaults, clear notices, and empowerment features | High |
| O.8 | Privacy impact documented for all new projects, features, and vendor integrations before launch | Critical |

## Technical Changes

### 1. Update `src/data/assessmentDomains.ts`
- Add domain **O** to the `DOMAINS` array with all 8 items above
- This automatically propagates to the Rapid Assessment domain picker and scoring

### 2. Update `src/pages/PhaseDashboard.tsx`
- Update total items count from `/84` to `/92` in the stat cards
- Add domain O to the penalty map under "Notice/consent/rights/governance" (Rs.50 Cr tier)
- The domain breakdown table, charts, and narrative auto-compute from the DOMAINS array — no changes needed there

### 3. No database changes needed
- The existing `assessment_checks` table already supports arbitrary `check_id` values (e.g., "O.1", "O.2") and `domain` values — no migration required

