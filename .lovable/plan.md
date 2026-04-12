

## Plan: Excel Bulk Import for Framework Domains & Requirements

### Overview
Add an "Import from Excel" button to the Framework Manager that lets admins upload an `.xlsx` file to bulk-populate a framework's domains and requirements. The Excel file is parsed client-side using the `xlsx` (SheetJS) library — no backend changes needed since the existing Supabase tables and RLS policies already support admin inserts.

### Expected Excel Format
The admin uploads a workbook where **Sheet 1** contains rows with these columns:

| Domain Code | Domain Name | Section Ref | Penalty Ref | Item Code | Description | Guidance | Risk Level | Evidence Type | SDF Only |
|---|---|---|---|---|---|---|---|---|---|
| A | Notice & Consent | S.5-6 | ₹50Cr | A.1 | Publish privacy notice | Must be clear... | high | Document | No |

- Domains are auto-deduced from unique `Domain Code` + `Domain Name` pairs
- `display_order` is auto-assigned based on row order
- Columns like Guidance, Section Ref, Penalty Ref are optional

### Changes

**1. Install `xlsx` package** (SheetJS — client-side Excel parser, ~200KB)

**2. File: `src/pages/AdminFrameworkManager.tsx`**
- Add an "Import Excel" button next to "Add" in the Frameworks panel header (visible when a framework is selected)
- Add a hidden `<input type="file" accept=".xlsx,.xls,.csv">` ref
- On file select:
  1. Parse with `xlsx.read()` → get first sheet as JSON array
  2. Show a preview dialog with parsed row count, detected domains count, and sample rows
  3. On confirm:
     - Extract unique domains → batch insert into `framework_domains`
     - For each domain, collect its requirements → batch insert into `framework_requirements`
     - Use `display_order` based on row position
     - Map risk_level/evidence_type to valid values with sensible defaults
  4. Refresh the domains list
  5. Show success toast with counts

**3. Preview/Confirm Dialog**
- Shows: "Found X domains, Y requirements from Z rows"
- Table preview of first 5 rows
- Option to choose behavior: "Replace existing" (delete then insert) or "Append" (skip duplicates by item_code)
- Import button with loading spinner

### How Assessment Creation Already Works
The existing assessment flow in `Assessments.tsx` and `PhaseRapidAssessment.tsx` already queries `framework_domains` and `framework_requirements` dynamically based on `framework_ids`. So once domains/requirements are imported via Excel for any framework, assessments created with that framework will automatically use them — no changes needed to the assessment pages.

### Technical Details
- SheetJS (`xlsx`) parses entirely client-side — no edge function needed
- Batch inserts use Supabase `.insert([...])` with arrays (existing RLS admin policies allow this)
- Column header matching is case-insensitive and flexible (e.g., "domain_code" or "Domain Code")
- Invalid/missing risk_level defaults to "standard", evidence_type defaults to "Document"
- SDF Only column accepts "Yes"/"True"/"1" as truthy

### Files Modified
- `package.json` — add `xlsx` dependency
- `src/pages/AdminFrameworkManager.tsx` — add import button, file input, preview dialog, parsing logic

### No Changes To
- Database schema (tables already exist)
- Assessment pages (they already query framework data dynamically)
- Sidebar, routing, or any other pages

