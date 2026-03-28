

## Restructure Sidebar Navigation

### Summary
Replace the flat 16-item sidebar with 7 grouped sections, removing "Shared Reports" from nav (keeping route), and reorganizing items by functional domain.

### Changes

**File 1: `src/components/AppSidebar.tsx`** (rewrite nav arrays and group rendering)

Replace `mainNav`, `consentUserNav`, `consentAdminNav` with these section arrays:

| Section | Label | Visibility | Items |
|---------|-------|-----------|-------|
| Overview | "Overview" | all | Dashboard |
| Assess | "Assess" | all | Assessments, Templates & Reference |
| Build | "Build" | all | Policy Builder, Policy Register, Organisation Documents |
| Privacy Ops | "Privacy Operations" | canManageUsers | Consent Ledger, Notice Manager, Rights Desk, Grievances, Audit Log |
| My Privacy | "My Privacy" | all | Privacy Preferences |
| Administration | "Administration" | canManageUsers | User Management, AI Configuration, Settings |
| Assessment Phases | "Assessment Phases" | contextual (assessmentId) | Keep existing phases exactly |

Key details:
- Remove "Shared Reports" from sidebar (was `Share2` icon, `/shared`)
- Remove duplicate "Assessments" entry (currently both `/dashboard` and `/assessments` render Dashboard — keep `/assessments` route only in "Assess" section)
- Remove Framework Manager and Assessment Templates from sidebar (they're admin sub-features accessible from Settings/AI Config)
- Rename items per spec: "Assessment Repository" → "Templates & Reference", "Artefact Repository" → "Organisation Documents", "Policy & SOP Builder" → "Policy Builder"
- Update URLs for Privacy Ops to use `/admin/` prefix as specified
- Each section renders as its own `SidebarGroup` with `SidebarGroupLabel`
- Reuse existing `renderNavItem` function — no changes needed
- Keep logo, footer, phases, collapsed behaviour exactly as-is
- Remove unused `Share2`, `BookOpen`, `LayoutTemplate` imports; keep all others

**File 2: `src/App.tsx`** (no route changes)
- Keep `/shared` route alive (just not in sidebar)
- Keep `/assessments` route as-is
- No changes needed per the spec

### What stays the same
- `getPhases()` function and Assessment Phases conditional rendering
- Footer with profile info and sign out
- Logo/brand header
- `renderNavItem` helper
- All page components untouched
- All routes in App.tsx untouched
- Collapsed sidebar icon-only behaviour

### Item count
- Regular users: 7 items across 4 sections
- Admin users: 12 items across 6 sections (down from 16+)

