# Phase 4 — Department Management (Admin global + User per-assessment)

## Behaviour

**Non-admin users (Reviewer, GRC Manager, Auditor):**
- On Phase 4 only, can add departments **scoped to the current assessment**.
- Their custom departments appear as extra columns alongside the global list, but only inside that one assessment.
- They can remove only the departments they added on this assessment. Cannot edit/remove global ones.

**Admins (Super Admin):**
- On Phase 4 only, can manage the **global departments list** used by all future and existing assessments.
- Add new global departments, rename, soft-disable (hide), and reorder. Changes take effect for every assessment immediately.
- Admins can also add per-assessment ones if they want, same control as users.

The current `DEPARTMENTS` array in `src/data/assessmentDomains.ts` becomes the **seed** for the global list, then the runtime source of truth moves to the database.

## Database (migration)

Two new tables:

```sql
-- Global, app-wide departments (admin-managed)
create table public.global_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid
);

-- Per-assessment departments (any assessment owner can add)
create table public.assessment_custom_departments (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null,
  name text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (assessment_id, name)
);
```

**Seed**: insert the existing 9 departments (`HR`, `IT/Engg`, …) into `global_departments` with `display_order` 0..8.

**RLS — `global_departments`**
- SELECT: any authenticated user, where `is_active = true` (plus admins see all).
- INSERT / UPDATE / DELETE: admins only (`has_role(auth.uid(), 'admin')`).

**RLS — `assessment_custom_departments`** (mirrors `dept_grid`)
- SELECT / INSERT / DELETE: assessment owner (`assessments.user_id = auth.uid()`).
- Admins: full access.
- Shared reports: SELECT when an active `shared_reports` row exists for the assessment.
- No UPDATE policy (rename = delete + add).

## Phase 4 UI — `src/pages/PhaseDeptGrid.tsx`

- Load on mount (parallel):
  1. `global_departments` ordered by `display_order`, filtered to `is_active`.
  2. `assessment_custom_departments` for this assessment.
  3. existing `dept_grid` rows.
- Render columns as `[...globalDepts, ...customDepts]`. Cells continue to save by department **name** into `dept_grid`.
- Above the table, a slim toolbar:
  - For everyone: "Add department for this assessment" — `Input` + `Button`. On submit, insert into `assessment_custom_departments`. Validate: trimmed, non-empty, not duplicate (case-insensitive) of any global or existing custom.
  - For admins only: a small "Manage global departments" button that opens a `Sheet` (or `Dialog`) with a CRUD list of `global_departments` (add, rename, toggle active, drag-to-reorder via simple up/down buttons).
- Column header chrome:
  - Global department: plain header.
  - Per-assessment custom (added by current user or admin): small `×` button → confirm → delete the row, and also delete any `dept_grid` rows for that assessment+department to avoid orphan data.
- Existing Previous/Next buttons stay where they are.

## Downstream consumers

Replace direct imports of `DEPARTMENTS` from `assessmentDomains.ts` with a small helper that returns the merged list for a given assessment. Search and update:
- Phase 4 (this page) — primary consumer.
- Any export or scoring code that iterates departments — switch to "distinct departments present in `dept_grid` for this assessment" or call the same helper.

`DEPARTMENTS` constant stays in code as a fallback used only if the DB returns nothing (defensive), but no longer drives the UI.

## Permissions wiring

- "Add to this assessment" button: visible to any signed-in user who owns the assessment, and to admins. Hidden in shared/read-only views.
- "Manage global departments": gated behind `useIsAdmin()`.
- Auditors / read-only viewers: no add controls; columns are still visible.

## Out of scope
- Org-level (per-tenant) shared department lists between users.
- Renaming a per-assessment custom department (delete + re-add).
- Migrating existing `dept_grid` data when an admin renames a global department (rename updates the label going forward; old rows still match by name — for now we accept this, document the caveat in the admin sheet).

## Acceptance
- A non-admin user on `/assessment/:id/dept-grid` sees an "Add department" input; adding "Procurement" creates a new column **only in this assessment**, persists across reloads, and disappears for other assessments.
- An admin sees the same control plus a "Manage global departments" panel; adding "ESG" there makes it appear as a new column in every assessment immediately.
- Disabling a global department in the admin panel removes its column from new and existing assessment views (existing `dept_grid` rows for it remain in DB but are hidden).
- Built-in/global columns cannot be deleted by non-admins; the `×` only shows on per-assessment custom columns the user can manage.
- RLS prevents user A from seeing or modifying user B's per-assessment custom departments.
