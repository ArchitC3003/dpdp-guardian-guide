## Goal

On the **Phase 1 (Organisation Profile)** page, add a **"Download Questionnaire (Excel)"** button that lets the user download the **complete assessment workbook** — including the full **Department Practice Grid** alongside the domain questions, policy stack and legend. Wording, IDs, risk levels and grouping must match the live in-app assessment **verbatim**.

## Where it goes

`src/pages/PhaseOrgProfile.tsx` — outline button in the header next to **Next Phase**:

```
[ PHASE 1 ]  Organisation Profile        [ ⬇ Download Questionnaire ]  [ Next Phase → ]
```

Available from the moment a new assessment is created, even before a DPDP role is picked. A small helper line under the button: _"Offline working copy — covers all 92 control questions, 37 policy artefacts and the 9-department × 14-control grid."_

## Source of truth (no duplication)

Pull straight from `src/data/assessmentDomains.ts`:
- `DOMAINS[]` → 14 domains × items (Phase 4 Rapid Assessment).
- `POLICY_ITEMS` → categories `P / S / R / C` (Phase 3 Policy Matrix).
- `DEPARTMENTS[]` (9) and `DEPT_CONTROLS[]` (14) → Phase 5 Department Practice Grid.
- `SPECIAL_STATUS_OPTIONS` → for the cover sheet summary.

Conditional logic mirrored from `PhaseRapidAssessment` / `PhaseDashboard`:
- `domain.conditional === "children"` → only included when `special_status.children` is on.
- `domain.conditional === "consentMgr"` → only included when `special_status.consentMgr` is on.
- Items in `domain.sdfOnly[]` → marked `Applicability = "SDF only"`.

## Excel structure

Library: **SheetJS (`xlsx`) + `file-saver`** — both already in the project (used by `assessmentPackParser`, `exportUtils`). No new dependencies.

**Sheet 1 — Cover**
Key/value rows: Organisation, Industry, Entity Type, Employees, Data Subjects, Locations, Sectoral Regulators, DPDP Role (Joint/Dual flag), Special Statuses (comma list of enabled flags), Generated On (IST), Framework = "DPDP Act 2023", Counts (Domain items / Policy artefacts / Dept-Control cells), Source = "PrivcybHub Rapid Assessment v3.0".

**Sheet 2 — Assessment Questionnaire** (Phase 4 — verbatim)
Columns:

| Item ID | Domain Code | Domain Name | Section Reference | Penalty | Risk Level | Evidence Type | Requirement / Question | Applicability | Status | Evidence Status | Priority | Owner | Target Date | Notes |

- First 8 columns pre-filled from `DOMAINS`.
- `Applicability` = `"Applicable"` / `"SDF only"` / `"Conditional – children"` / `"Conditional – consentMgr"`.
- Status / Evidence / Priority / Owner / Date / Notes left blank for offline filling.
- Header row: bold white on teal `#0D9488`. Risk cells colour-tinted (critical=red, high=amber, standard=slate). Wrap-text on Requirement column (≈80 chars). Freeze top row.

**Sheet 3 — Policy & SOP Stack** (Phase 3 — verbatim)
Columns: `Item ID | Category Code | Category Label | Artefact Name | Status | Owner | Last Reviewed | Next Review | Document Link | Notes`. All 37 artefacts (P/S/R/C) listed; Status etc. blank.

**Sheet 4 — Department Practice Grid** (Phase 5 — verbatim — **the addition this turn requested**)
Built as a long-form matrix so it is both human-readable and re-importable:

| Department | Control # | Control Description | Risk Level | Status | Evidence Notes | Owner | Target Date |

- One row per **(department × control) = 9 × 14 = 126 rows**.
- Departments and control wording pulled directly from `DEPARTMENTS` and `DEPT_CONTROLS`.
- Status options documented on Legend sheet (`Yes / Partial / No / N/A`).
- Department names bold, merged visually via grouping (sorted by department then control #). Risk-level cells colour-tinted as on Sheet 2.
- Freeze top row + first two columns.

**Sheet 5 — Legend & Instructions**
- Status options: `Yes` (100%) / `Partial` (50%) / `No` (0%) / `N/A` (excluded).
- Evidence Status: `Verified–Seen`, `Stated–Not Verified`, `Not Available`.
- Priority: `P1–Immediate`, `P2–Short-term`, `P3–Planned`.
- Risk multipliers (critical=3, high=2, standard=1) and scoring formula.
- Penalty exposure summary (₹50 Cr / ₹200 Cr / ₹250 Cr).
- Note: _"Offline working copy. Re-import is not supported in this release — fill answers back into the live app to score."_

## File naming

`PrivcybHub_DPDP_Questionnaire_<orgNameSlug>_<YYYYMMDD>.xlsx`
(slug derived from `org_name`, falls back to `Untitled`).

## Implementation steps

1. **New util** — `src/utils/exportAssessmentQuestionnaire.ts`
   Exports `exportQuestionnaireToExcel(assessment)`. Imports `DOMAINS`, `POLICY_ITEMS`, `DEPARTMENTS`, `DEPT_CONTROLS`, `SPECIAL_STATUS_OPTIONS` from `@/data/assessmentDomains`. Builds the five sheets with `XLSX.utils.aoa_to_sheet`, applies styles via the SheetJS `s` property (fills, bold, wrap, freeze panes via `!freeze`), then `XLSX.writeFile` (or `writeFileXLSX`) and `saveAs` from `file-saver`.
2. **Wire-up** in `src/pages/PhaseOrgProfile.tsx`
   - Import the util and `Download` icon from `lucide-react`.
   - Add an outline `<Button>` in the existing header `flex` row, before the **Next Phase** button.
   - On click, call the util with the loaded `assessment`; show success/failure via `sonner` toast.
3. No DB migrations, no edge functions, no schema changes.
4. Purely additive — existing assessment flow untouched.

## Acceptance

- Button visible on Phase 1 right after a new assessment is created.
- Downloaded `.xlsx` opens cleanly in Excel and Google Sheets.
- Sheet 2 contains every domain item from `DOMAINS` (filtered by Phase 1 special-status flags) with identical wording/risk/evidence labels.
- **Sheet 4 contains all 9 departments × 14 controls = 126 rows**, with control text matching the in-app Department Practice Grid exactly.
- Sheet 3 lists all 37 policy artefacts. Cover and Legend sheets are populated as described.
- File name and Cover sheet reflect whatever org details have been entered so far (partial allowed).
