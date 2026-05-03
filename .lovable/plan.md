## Goal

Replace the current `/dashboard` (which duplicates the Assessments page) with a clean, role-aware **launcher dashboard** — a grid of hyperlinked module tiles (Assess, Build, Execute, Integrate, Learn, AI Copilot, plus Admin tiles) that mirrors the reference mockup, branded for PrivcybHub (dark slate + emerald).

## What changes

Single-file rewrite of `src/pages/Dashboard.tsx`. No routing, sidebar, or DB changes.

### Layout

```text
┌──────────────────────────────────────────────────────┐
│ Welcome, {name}  ·  {Role badge}  ·  {Org}           │
├──────────────────────────────────────────────────────┤
│  [Assess]      [Build]        [Execute*]             │
│  [Integrate*]  [Learn*]       [AI Copilot] (dark)    │
├──────────────────────────────────────────────────────┤
│  Admin Tools (Super Admin / GRC Manager only)        │
│  [Frameworks] [Users] [AI Config] [Privacy Ops…]     │
├──────────────────────────────────────────────────────┤
│  Recent Activity (last 5)   │  Overall Readiness %   │
└──────────────────────────────────────────────────────┘
```
\* Execute / Integrate / Learn render as **"Coming Soon"** tiles (disabled CTA, muted styling) since routes don't exist yet.

### Tile spec

Each tile = `Card` with: pastel/emerald icon chip, title, 2–3 line description, primary CTA button → `navigate(url)`. Matches the reference image's structure but uses PrivcybHub dark theme (slate bg, emerald `#059669` accents, DM Sans). AI Copilot tile uses inverted dark surface to stand out.

### Role-based visibility

Uses existing `usePermissions()` hook:

| Tile | Visible to |
|---|---|
| Assess, Build, Execute, Integrate, Learn, AI Copilot | All roles |
| Admin Tools section (Frameworks, Users, AI Config, Assessment Templates) | `canManageUsers` (Super Admin only) |
| Privacy Operations tiles (Consent Ledger, Notice Manager, Rights Desk, Grievances) | `canManageUsers` (Super Admin + GRC Manager — matches sidebar logic) |
| Recent Activity, Readiness % | All roles |

### Tile → route map

- Assess → `/assessments`
- Build → `/policy-sop-builder`
- Execute → *(disabled — coming soon)*
- Integrate → *(disabled — coming soon)*
- Learn → *(disabled — coming soon)*
- AI Copilot → opens existing PrivacyAssistant (already global) or links to `/policy-sop-builder` chat
- Frameworks → `/admin/frameworks`
- Users → `/settings/users`
- AI Config → `/admin/ai-config`
- Assessment Templates → `/admin/assessment-templates`
- Consent Ledger → `/consent/ledger` (etc.)

### Bottom widgets (kept, slimmed down)

- **Recent Activity**: last 3 assessment updates + last 2 policy doc updates (merged, sorted by `updated_at`). Click → navigate to that item.
- **Overall Readiness**: average `compliance_score` across user's assessments rendered as a circular progress (Recharts `RadialBar` already in stack) with the % in the center — mirrors the mockup's 85% donut.

## Out of scope

- Building Execute / Integrate / Learn pages (tiles are placeholders only).
- New DB tables, migrations, or RLS changes.
- Sidebar restructuring.

## Technical notes

- File touched: **`src/pages/Dashboard.tsx`** (full rewrite, ~250 lines).
- Reuses: `usePermissions`, `useAuth`, `Card`, `Button`, `Badge`, lucide icons (`ClipboardList`, `Compass`, `Play`, `Plug`, `GraduationCap`, `Sparkles`, `Shield`, `Users`, `Bot`, `BookOpen`, `ScrollText`).
- Readiness donut: Recharts `RadialBarChart` (already a project dep per memory).
- Removed from current Dashboard: stat cards, framework distribution chart, template picker dialog, assessment list with delete buttons (all of these live on `/assessments` already).
