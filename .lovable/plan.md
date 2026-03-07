

## Plan: Extend Admin Rights to All Navigation Areas

### What Changes

Admin users (verified via `has_role` RPC) will gain edit/delete capabilities across **Dashboard**, **Assessment Repository**, and **Shared Reports** — currently they only have admin powers in the Artefact Repository.

### 1. Database Migration — Admin RLS Policies

Add admin-level RLS policies to allow full CRUD on these tables:

- **assessments**: Admin can SELECT, UPDATE, DELETE all rows
- **assessment_checks**: Admin can SELECT, INSERT, UPDATE, DELETE all rows
- **policy_items**: Admin can SELECT, INSERT, UPDATE, DELETE all rows  
- **dept_grid**: Admin can SELECT, INSERT, UPDATE, DELETE all rows
- **shared_reports**: Admin can SELECT, UPDATE, DELETE all rows
- **file_references**: Admin can SELECT, INSERT, UPDATE, DELETE all rows

All policies will use `has_role(auth.uid(), 'admin')`.

### 2. Dashboard (`src/pages/Dashboard.tsx`)

- Import and use `useIsAdmin` hook
- When admin: load ALL users' assessments (not just own)
- Show delete button for any assessment (already visible for own, extend to all)

### 3. Assessment Repository (`src/pages/Repository.tsx`)

- Import and use `useIsAdmin` hook
- Admin can edit statuses, notes, upload/delete files for any assessment's repository items (currently scoped to own user)

### 4. Shared Reports (`src/pages/SharedReports.tsx`)

- Import and use `useIsAdmin` hook
- Add an admin section showing all shared reports with ability to deactivate/delete them

### Files Modified
| File | Change |
|------|--------|
| DB migration | Admin RLS policies on 6 tables |
| `src/pages/Dashboard.tsx` | useIsAdmin, load all assessments if admin, show controls |
| `src/pages/Repository.tsx` | useIsAdmin, enable editing for admin |
| `src/pages/SharedReports.tsx` | useIsAdmin, admin management section |

