

## Fix: Add `/consent/*` Routes and Update Sidebar Navigation

### Problem
The existing consent admin pages are registered under `/admin/*` paths (e.g., `/admin/consent-ledger`), but the user expects them at `/consent/*` paths (e.g., `/consent/ledger`). There's also no `/consent` landing route.

### Plan

**1. `src/App.tsx` — Add `/consent/*` route aliases**

Add these new routes inside the `<ProtectedRoutes />` block, reusing the same imported components:

| New Route | Component |
|---|---|
| `/consent` | `ConsentLedger` (as default landing) |
| `/consent/ledger` | `ConsentLedger` |
| `/consent/notices` | `NoticeManager` |
| `/consent/rights-desk` | `RightsDesk` |
| `/consent/grievances` | `GrievanceConsole` |
| `/consent/audit-log` | `ConsentAuditLog` |

The existing `/admin/*` routes remain untouched for backward compatibility.

**2. `src/components/AppSidebar.tsx` — Update sidebar nav URLs**

Update the `consentAdminNav` array URLs from `/admin/*` to `/consent/*`:

- `/admin/consent-ledger` → `/consent/ledger`
- `/admin/notice-manager` → `/consent/notices`
- `/admin/rights-desk` → `/consent/rights-desk`
- `/admin/grievance-console` → `/consent/grievances`
- `/admin/consent-audit-log` → `/consent/audit-log`

No component logic, DB queries, or layout changes will be modified.

