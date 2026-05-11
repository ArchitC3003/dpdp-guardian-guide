# Department Question Library — Schema + Seed

## Overview

Add a relational department-interview question library to support per-department assessments under `assessments`. Six new tables, RLS, and seed data for 7 departments + 17 universal questions + 6 Product Engineering extras.

## Migration 1 — Tables

All tables in `public`. Standard `id uuid PK default gen_random_uuid()`, timestamps as specified.

1. **`universal_question_templates`** — system question library (17 rows).
   - `question_id` UNIQUE, `category`, `display_order`, `question_text` (with `{{dept_name}}`), `processor_text`, `joint_text`, `dual_note`, `applicable_to_roles text[]`, `dept_specific_only`, `dpdp_section_ref`.

2. **`dept_templates`** — catalogue of departments (7 system rows + user-added).
   - `dept_code` UNIQUE, `dept_name`, `doc_ref`, `is_system`, `is_active`, `created_by`, `ai_generated`.

3. **`dept_question_extras`** — extra questions per department (FK `dept_code` → `dept_templates.dept_code`).
   - UNIQUE (`dept_code`, `question_id`).

4. **`assessment_departments`** — a department instance attached to one assessment.
   - FK `assessment_id` → `assessments(id) ON DELETE CASCADE`, FK `dept_code` → `dept_templates(dept_code)`.
   - rep/interview metadata, status, completion %, high-risk count.

5. **`dept_question_responses`** — one row per question answered in a dept assessment.
   - FK `assessment_id`, FK `dept_assessment_id` → `assessment_departments(id) ON DELETE CASCADE`.
   - response/status/risk/evidence/notes/role_context + AI suggestion fields.

6. **`dept_app_inventory`** — apps/vendors captured per dept assessment.
   - FK `assessment_id`, FK `dept_assessment_id`, `dept_code`.
   - vendor, type, function, data description, `personal_data_categories text[]`, DPA + security status.

Add an `update_updated_at_column` trigger on `assessment_departments` and `dept_question_responses`.

## Migration 2 — RLS

Enable RLS on all six tables.

**System catalogue tables** (`universal_question_templates`, `dept_templates`, `dept_question_extras`):
- SELECT: any authenticated user.
- INSERT/UPDATE/DELETE: admins only (`has_role(auth.uid(),'admin')`), plus owners of non-system rows in `dept_templates` (`created_by = auth.uid() AND is_system = false`).

**Assessment-scoped tables** (`assessment_departments`, `dept_question_responses`, `dept_app_inventory`):
- ALL ops gated by ownership of the parent `assessments` row:
  ```sql
  EXISTS (SELECT 1 FROM assessments a
          WHERE a.id = <table>.assessment_id
            AND a.user_id = auth.uid())
  ```
- Admin override via `has_role(auth.uid(),'admin')`.
- Read access for active `shared_reports` (matches existing pattern on `dept_grid`, `assessment_checks`).

> Note: `assessments` is keyed by `user_id`, not org. The request says "belongs to their organisation" — I'll mirror the existing per-user pattern used everywhere else in this app (assessments has no org column). Flag if you actually want a multi-tenant org model.

## Seed data (run via `supabase--insert` after migration approval)

### `dept_templates` — 7 rows
purchase_procurement, legal_secretarial, finance, sales, hr, administration, product_engineering — all `is_system=true`, `doc_ref` as supplied.

### `universal_question_templates` — 17 rows
Order/categories as specified. `question_text` uses `{{dept_name}}`. Role variants:

| ID | Category | Has processor_text | Has joint_text |
|---|---|---|---|
| DP-01, DP-02 | Data Principals & Personal Data | — | — |
| CC-01…CC-04 | Collection & Consent | ✓ | ✓ |
| SR-01…SR-03 | Storage & Retention | — | — |
| IS-01, IS-02 | Internal Sharing | — | — |
| ES-01…ES-03 | External Sharing | ✓ | ✓ |
| DR-01…DR-03 | Data Principal Rights | ✓ | ✓ |

`applicable_to_roles` defaults to `{fiduciary,processor,joint}`. `dpdp_section_ref` populated per question (e.g. CC-01 → "S.6", DR-01 → "S.11", SR-01 → "S.8(7)").

### `dept_question_extras` — 6 rows for `product_engineering`
PD-01/PD-02/PD-03 (Privacy by Design), SD-01/SD-02/SD-03 (Secure by Design), display_order 18–23.

## Question wording

Since you didn't paste verbatim text for the 17 universal + 6 PE/SD questions, I will draft DPDP-aligned wording for each (covering the obligation in plain English, with `{{dept_name}}` substitution and role-specific reframing in `processor_text`/`joint_text`). If you have canonical wording from the PrivCybHub handbook you'd rather use, paste it and I'll seed that instead.

## Out of scope (this turn)

- UI to render/answer the questions
- Wiring into existing Phase pages or the new Execute workspace
- AI suggestion generation logic

## Open questions

1. **Org-scoped vs user-scoped RLS** — confirm per-user is fine (matches existing app), or should I add an `organisation_id` model first?
2. **Question wording** — draft from DPDP text, or wait for your canonical copy?
