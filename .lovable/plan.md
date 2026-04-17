
## Plan: Universal Assessment Pack — DPDP Seed + 4-Sheet Upload

This replaces the current narrow "Import Excel" (domains only) with a complete "Assessment Pack" upload that creates an entire framework — info, requirements, policy artefacts, dept controls, and special flags — from one XLSX. Plus seeds the existing DPDP framework with all the supporting data.

### Part 1 — Database (migrations)

The 3 supporting tables and their RLS already exist (`framework_policy_artefacts`, `framework_dept_controls`, `framework_special_flags`). Two remaining DB tasks:

1. **`policy_items.framework_id`** — add nullable FK to `assessment_frameworks(id)` (only if the column doesn't exist yet).
2. **Seed DPDP data** (resolve framework_id dynamically by `short_code='DPDP'` or name ILIKE):
   - 37 policy artefacts (P.01–P.11, S.01–S.12, R.01–R.09, C.01–C.05) into `framework_policy_artefacts`
   - 14 department controls into `framework_dept_controls`
   - 8 special status flags (sdf, consentMgr, children, crossBorder, legacy, thirdSchedule, intermediary, startup) into `framework_special_flags`
   - All inserts wrapped with `ON CONFLICT DO NOTHING` so re-running is safe.

### Part 2 — UI: Framework Manager rewrite

**File: `src/pages/AdminFrameworkManager.tsx`**

- **Remove** the existing "Import Excel" button + dialog from the Domains panel (line ~487 + dialog at ~710).
- **Add** two buttons in the **Frameworks panel header**, next to "Add":
  - `Download Template` — generates a 4-sheet blank XLSX
  - `Upload Pack` — opens a 3-step dialog

**File: `src/utils/assessmentPackParser.ts`** (new helper)
- `parsePack(file)` → returns `{ info, flags, checklist, artefacts, deptControls }`
- `validatePack(parsed, mode, existingShortCodes)` → returns `{ errors[], warnings[] }`
- `buildTemplateXlsx()` → returns Blob for download

### 3-Step Upload Dialog (shadcn Dialog, max-w-5xl)

```text
┌─ Step 1: Upload ────────────────────────────────────┐
│  ○ Create New Framework  ○ Populate Existing [▼]   │
│  ┌─ Drag & drop .xlsx here ─────────┐               │
│  │           [📥 Upload icon]        │               │
│  └──────────────────────────────────┘               │
│  [Download Template]              [Cancel] [Next →] │
└─────────────────────────────────────────────────────┘

┌─ Step 2: Preview & Validate ────────────────────────┐
│  Framework Info: ● GDPR · EU/EEA · v2016/679        │
│  ┌─Checklist─┐ ┌─Artefacts─┐ ┌─Controls─┐ ┌─Flags─┐│
│  │ 8 dom · 92│ │ 4 cat · 37│ │  14 ctrl │ │ 8 flg ││
│  └───────────┘ └───────────┘ └──────────┘ └───────┘│
│  ⚠ Validation: [❌ errors] [⚠ warnings]             │
│  [Tabs: Checklist | Artefacts | Controls | Flags]   │
│  preview table: first 20 rows + "X more"            │
│              [← Back]              [Import →]       │
└─────────────────────────────────────────────────────┘

Step 3: Execute → progress toast → success toast → close
```

### Import execution order

1. If "Create New": insert `assessment_frameworks` row (validate `short_code` unique).
2. Group Sheet 2 by `domain_code` → insert unique `framework_domains` (display_order = first appearance).
3. Insert `framework_requirements` (resolve `domain_id` from step 2).
4. If Sheet 3 present → insert `framework_policy_artefacts`.
5. If Sheet 4 present → insert `framework_dept_controls`.
6. If Sheet 1 has flag rows → insert `framework_special_flags`.
7. Create default `assessment_templates` row + link in `assessment_template_frameworks`.
8. Toast: "Imported [name]: X domains, Y reqs, Z artefacts, W controls".
9. Refresh list, auto-select imported framework.

### Validation rules

| Type | Check |
|---|---|
| ❌ Error | Sheet 2 missing |
| ❌ Error | Missing required columns: `domain_code`, `domain_name`, `item_code`, `description`, `risk_level` |
| ❌ Error | `risk_level` not in (`critical`, `high`, `standard`) |
| ❌ Error | Duplicate `item_code` in Sheet 2 |
| ❌ Error | Create-new mode: missing `name` / `short_code` |
| ❌ Error | Create-new mode: `short_code` already in DB |
| ⚠ Warning | Sheet 1, 3, or 4 missing |
| ⚠ Warning | No special flags |

### Assessment integration (no changes needed)

`Assessments.tsx` and `PhaseRapidAssessment.tsx` already query `framework_domains` + `framework_requirements` dynamically by `framework_ids`. Any framework imported via Pack works in assessments automatically. `framework_policy_artefacts`, `framework_dept_controls`, `framework_special_flags` are already wired into PhaseDeptGrid and PhasePolicyMatrix where applicable.

### Files touched

| File | Change |
|---|---|
| migration (new) | DPDP seed: 37 + 14 + 8 rows; add `policy_items.framework_id` if missing |
| `src/utils/assessmentPackParser.ts` (new) | parse / validate / template builder |
| `src/pages/AdminFrameworkManager.tsx` | remove old Import Excel UI, add Upload Pack + Download Template + 3-step dialog |
| `package.json` | `xlsx` already installed; add `file-saver` for template download |

### Notes on the earlier login issue
Unrelated to this feature. The Google OAuth code is correct and works on the published URL — preview environments occasionally proxy-block OAuth. We can revisit if it still fails on the published URL after this work lands.
