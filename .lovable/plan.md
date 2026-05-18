# Dependency Vulnerability Remediation Plan

## 1. Current state (just audited)

I ran both `bun`'s dependency scanner and `npm audit --json` against the project's installed tree.

**Result: 0 remaining high or critical vulnerabilities.**

- `xlsx` was already remediated in the previous turn — npm `xlsx@0.18.5` was removed and replaced with the patched SheetJS CDN tarball `xlsx@0.20.3` (fixes GHSA-4r6h-8v6p-xvw6 prototype pollution and GHSA-5pgg-2g8v-p4x9 ReDoS).
- `npm audit` reports `total: 0` vulnerabilities across all 746 installed packages.
- `bun.lock` was rewritten by Bun at install time and already reflects the patched `xlsx` resolution from `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`.

So there is nothing left to *patch*. The remaining work is to (a) produce the formal report you asked for and (b) put preventative controls in place so this doesn't regress.

## 2. What I will do

### Step 1 — Generate the dependency & patch report
Write a single markdown report to `/mnt/documents/dependency-security-report.md` containing:
- Audit summary (date, package count, vulns before vs. after).
- The `xlsx` advisory table with the exact remediation taken (CDN tarball pin).
- Full `npm audit` output (post-fix, showing 0 findings).
- `bun.lock` diff confirmation that the new resolution is locked.
- List of all production deps with current version and latest version, flagging any majors behind (informational only — not a vuln).

Deliver it via `<presentation-artifact>` so you can download it.

### Step 2 — Implement preventative controls

1. **CI audit guard** — add `scripts/security-audit.mjs` that runs `npm audit --audit-level=high --json` and exits non-zero if any high/critical appears. Wire it into `package.json` as `"audit": "node scripts/security-audit.mjs"`.
2. **Pin the SheetJS source of truth** — `xlsx` currently resolves to a CDN URL. Add a short note in `README.md` under a "Security" heading explaining: do not run `bun add xlsx` from npm — the npm package is abandoned at 0.18.5 and re-introduces both advisories. Always use the SheetJS CDN tarball.
3. **Security memory update** — call `security--update_memory` so the scanner records:
   - `xlsx` is intentionally sourced from `cdn.sheetjs.com` (do not flag the URL dependency as suspicious).
   - Any future PR that downgrades `xlsx` back to the npm registry must be rejected.
4. **Mark the supply_chain finding fixed** (already done in the previous turn — will verify it's still cleared after the scan).

### Step 3 — Re-run scanner & confirm
Run `code--dependency_scan` once more after the report is written; attach the clean result to the report.

## 3. What I will NOT do
- No source code refactors — `src/utils/assessmentPackParser.ts` and other `import * as XLSX from "xlsx"` call sites work unchanged against 0.20.3 (API is backwards compatible).
- No major-version upgrades of unrelated deps (React, Vite, Radix, etc.) — those aren't vulnerable and a blanket upgrade carries regression risk you didn't ask for. They'll be listed in the report as "informational, upgrade at your discretion".
- No changes to `src/integrations/supabase/client.ts`, `types.ts`, `.env`, or `supabase/config.toml` (protected files).

## 4. Deliverables when implementation runs
- `/mnt/documents/dependency-security-report.md` (downloadable artifact)
- `scripts/security-audit.mjs` (new)
- `package.json` (added `audit` script only)
- `README.md` (added Security section)
- Updated security memory
