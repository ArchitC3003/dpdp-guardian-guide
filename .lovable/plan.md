
Goal: make the pasted XLSX template the official format and ensure the app can both generate it and import it reliably.

What I found
- The current parser and template are not aligned.
- Your pasted template uses:
  - sheet names with spaces: `Framework Info`, `Assessment Checklist`, `Policy Artefacts`, `Department Controls`
  - an AoA-style key/value info sheet
  - a `SPECIAL_STATUS_FLAGS` section inside the info sheet
  - a new `conditional_flag` column on checklist rows
- The current parser expects a different structure:
  - mostly JSON-style sheets
  - flags mixed into the same row structure
  - no support for the `SPECIAL_STATUS_FLAGS` section
  - no `conditional_flag` field on requirements
- Database review confirms:
  - `framework_domains` already has `conditional_flag`
  - `framework_requirements` does not

Implementation plan
1. Update the parser to support your template format
- Teach `parsePack` to recognize both the current names and your new sheet names.
- Parse `Framework Info` as row-by-row data:
  - read key/value pairs first
  - detect `SPECIAL_STATUS_FLAGS`
  - treat the next row as flag headers
  - parse all following non-empty rows as special flags
- Parse `Assessment Checklist` including `conditional_flag`.
- Keep backward compatibility so older packs still import.

2. Extend the pack types and validation
- Add `conditional_flag?: string` to parsed checklist rows.
- Validate that any `conditional_flag` used in the checklist matches a defined `flag_key` when flags are present.
- Improve error messages so users know whether the issue is sheet naming, section formatting, or unknown flag references.

3. Add a database column for requirement-level gating
- Create a migration to add nullable `conditional_flag text` to `framework_requirements`.
- Keep it optional so existing data continues to work.
- No RLS change needed if only the column is added.

4. Wire import execution to save the new field
- In `AdminFrameworkManager`, persist checklist `conditional_flag` into `framework_requirements`.
- Keep existing domain-level `conditional_flag` untouched unless explicitly set elsewhere.
- Preserve current create/populate behavior.

5. Replace the template download with your structure
- Update `downloadTemplate()` to generate your 4-sheet layout exactly:
  - `Framework Info`
  - `Assessment Checklist`
  - `Policy Artefacts`
  - `Department Controls`
- Use your section ordering and example rows so what users download is exactly what the importer expects.

6. Refresh UI copy in the upload flow
- Update the upload dialog text so it references the new sheet names and special flag section format.
- If preview tables show checklist columns, surface `conditional_flag` there too.

Technical details
- Files likely to change:
  - `src/utils/assessmentPackParser.ts`
  - `src/pages/AdminFrameworkManager.tsx`
  - `supabase/migrations/*` for `framework_requirements.conditional_flag`
- Recommended data model:
  - `framework_domains.conditional_flag` = domain-level gating
  - `framework_requirements.conditional_flag` = requirement-level gating from your checklist
- Compatibility approach:
  - support both old and new packs during parsing
  - generate only the new template going forward

Expected result
- The downloaded XLSX matches your pasted format.
- Uploading that same XLSX works without validation mismatch.
- Special status flags are parsed from the info sheet section correctly.
- Requirement rows can carry their own `conditional_flag` and be stored properly.