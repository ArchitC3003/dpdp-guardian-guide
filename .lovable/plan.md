## Goal

Build the **Execute** module — a flower-style D3 sunburst that lets a user pick one or more industries from PrivCybHub's 88-sub-sector × 16-cluster taxonomy, capture an Organisation Profile, and land in a **Workspace Dashboard** that becomes the home for the bespoke DPDP programme. The Workspace will (in v1) link to existing **Assessment** and **Build** flows, prefilling them with the industry/regulatory context picked here.

The uploaded `PrivCybHub_Sectoral_Classification_Handbook_v1.0.docx` (schema `privcybhub.sectoral.v1`, ID format `PCH-{Cluster:02d}.{SectorGroup:02d}.{SubSector:02d}`) is the source of truth. The 88-record JSON in the prompt is embedded verbatim, plus the per-record **Regulatory Crosswalk** from §3a (Sectoral_Regulator_IN, GDPR, CCPA/CPRA, HIPAA).

## Scope

**In scope (this turn)**
- New routes: `/execute`, `/execute/select`, `/execute/profile`, `/execute/workspace/:id`
- Sidebar entry **Execute** (top of an "Execute" group, above Assess)
- D3 v7 sunburst (flower / petal aesthetic), multi-select, hover side panel, disambiguation drawer
- Org Profile form (playful, minimal)
- Workspace Dashboard with Industry Profile, Triggered Flags, Regulatory Crosswalk, and 3 function tiles
- Two of the tiles **wired**: **Assessment** (creates a new assessment seeded with sector context) and **Build** (opens Policy Builder with workspace context). **Repository** stays locked.
- Supabase `execute_workspaces` table with RLS

**Out of scope**
- Editing Build/Assessment to consume new context fields beyond what they already accept (we pass via query string + a small `useExecuteContext` hook; deeper personalisation is v1.1)
- v1.1 sector-specific DPDP provision text (handbook §1 explicitly defers this)
- Any change to existing routes, tables, or scoring logic

## User journey

```text
Sidebar ▸ Execute
   │
   ▼
/execute            Landing — single CTA "Begin"
   │
   ▼
/execute/select     D3 sunburst (Cluster › Sector_Group › Sub_Sector › Micro_Activity)
                    multi-select · hover side-panel · disambiguation drawer
                    ↓ Continue with N selection(s)
   │
   ▼
/execute/profile    Org Profile form (3 grouped steps, fade-in)
                    ↓ Create Workspace  → INSERT execute_workspaces
   │
   ▼
/execute/workspace/:id
   ┌──────────────────────────────────────────────────────────┐
   │ Org name · created at IST                                │
   │ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐ │
   │ │ Industry        │ │ Triggered Flags │ │ Regulatory   │ │
   │ │ Profile (chips) │ │ SDF/Children/…  │ │ Crosswalk    │ │
   │ └─────────────────┘ └─────────────────┘ └──────────────┘ │
   │ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
   │ │ Assess   │ │ Build    │ │ Repo 🔒  │                   │
   │ └──────────┘ └──────────┘ └──────────┘                   │
   └──────────────────────────────────────────────────────────┘
```

## Files to add

```text
src/pages/execute/
  ExecuteLanding.tsx
  ExecuteSunburst.tsx
  ExecuteOrgProfile.tsx
  ExecuteWorkspace.tsx

src/components/execute/
  SunburstChart.tsx          // D3 v7, flower aesthetic
  SelectionTray.tsx          // chip tray of current picks
  IndustrySidePanel.tsx      // hover detail (ID, path, exposure, regulator, GDPR/CCPA/HIPAA)
  DisambiguationDrawer.tsx
  TriggeredFlagsCard.tsx
  IndustryProfileCard.tsx
  RegulatoryCrosswalkCard.tsx
  LockedFunctionTile.tsx
  ActiveFunctionTile.tsx

src/data/
  privcybhubIndustries.ts    // 88-record dataset (verbatim) + tree builder + crosswalk fields

src/types/execute.ts         // ExecuteIndustry, ExecuteWorkspace, OrgProfile
src/hooks/useExecuteWorkspace.ts
```

Routes added inside `<ProtectedRoutes />` in `src/App.tsx`. Sidebar gets a new section **Execute** with one item (icon: `Compass`) placed above **Assess**.

## Data model

**New dependency:** `d3` v7 + `@types/d3`.

**Static dataset** in `src/data/privcybhubIndustries.ts` — the 88 records from the prompt, **plus** four crosswalk fields per record from handbook §3a:

```ts
type ExecuteIndustry = {
  PrivCybHub_Sector_ID: string;        // PCH-NN.NN.NN
  Cluster_ID: number;                  // 1..16
  Cluster: string;
  Sector_Group: string;
  Sub_Sector: string;
  Micro_Activity: string;
  DPDP_Exposure: "Low" | "Medium" | "High";
  Analysis_Granularity: "Cluster" | "Sector_Group" | "Sub_Sector" | "Micro_Activity";
  Sectoral_Regulator: string;
  GDPR_Applicability: "Universal" | "Heightened" | "Sector-Triggered";
  CCPA_Applicability: "Applies" | "Out of Scope";
  HIPAA_Applicability: "Covered" | "Adjacent" | "Out of Scope";
};
```

(Crosswalk values are taken straight from the handbook's §3a tables; defaults used where the handbook abbreviates a row: GDPR=Universal, CCPA=Applies, HIPAA=Out of Scope. Healthcare cluster overridden to HIPAA=Adjacent per handbook.)

**New Supabase table** (migration):

| column | type | notes |
|---|---|---|
| id | uuid pk default gen_random_uuid() | |
| user_id | uuid not null | RLS = `user_id = auth.uid()` |
| org_name | text not null | |
| trade_name | text | |
| group_structure | text | |
| footprint | text[] not null | |
| employee_band | text not null | |
| principals_band | text not null | |
| primary_role | text not null | Fiduciary/Processor/Both |
| selected_sector_ids | text[] not null | PCH-... ids |
| triggered_flags | jsonb not null default '{}' | snapshot at creation |
| crosswalk_summary | jsonb not null default '{}' | snapshot {gdpr, ccpa, hipaa, regulators[]} |
| created_at | timestamptz default now() | |

RLS: enabled, full CRUD restricted to `user_id = auth.uid()`. No roles needed.

## Sunburst (D3 v7) — flower / petal aesthetic

- `d3.hierarchy` + `d3.partition()` over Cluster → Sector_Group → Sub_Sector → Micro_Activity, leaves `value: 1` (equal-weight petals).
- Inner ring petals (Clusters) are wide and bold; each successive ring narrows and lightens — gives a tapering "petal" silhouette. Slight `cornerRadius` and `padAngle` so petals look like flower petals, not pie slices.
- 16-hue cluster palette added as HSL tokens `--exec-cluster-1..16` in `index.css` and `tailwind.config.ts`. Opacity ramps inner→outer (1.0 → 0.55).
- **Hover:** highlight petal + ancestors, dim siblings; right-side `IndustrySidePanel` shows: PCH ID, breadcrumb, DPDP Exposure chip (Low/Med/High), Analysis Granularity, Sectoral Regulator, GDPR/CCPA/HIPAA badges.
- **Click rules** (driven by petal's `Analysis_Granularity`):
  - Click depth ≥ required granularity → all leaf descendants of that node added to selection.
  - Click depth < required granularity → `DisambiguationDrawer` opens with descendants as checkboxes; user picks ≥ 1.
- **Multi-select:** plain click replaces; **Cmd/Ctrl-click** adds. `SelectionTray` chips with `×`.
- Floating bottom-right CTA `Continue with N selection(s)` (disabled at 0).

## Org Profile (Screen 3)

Single page, 3 fade-in groups: **Identity** (legal name*, trade name, group structure radio), **Footprint** (multi-chip: India only / EU / US-California / US-other / UK / UAE / Singapore / Other), **Scale** (employee band, principals band, primary role). "Selected industries" rendered read-only at top. Validation: legal name + footprint ≥ 1 + all radios required. CTA `Create Workspace` → insert + route to `/execute/workspace/:id`.

## Computed snapshots (stored at creation)

`triggered_flags`:

```ts
SDF Likelihood    = any selected exposure==="High" ? "High" : "Standard"
Children Data     = clusters includes 13 ? "Core" : "Incidental"
Health Data       = clusters includes 12 ? "Core" : "None"
Financial Data    = clusters includes 6  ? "RBI-regulated" : "None"
Cross-Border      = footprint has any non-"India only" ? "Active" : "Domestic"
Sectoral Overlay  = unique Sectoral_Regulator strings (top 3 + "+N more")
```

`crosswalk_summary` (driven by handbook §3a):

```ts
GDPR  = "Universal" if any selection Heightened/Universal else "Limited"
CCPA  = footprint includes US-California && any selection==="Applies" ? "Triggered" : "Watch"
HIPAA = clusters includes 12 ? "In-scope (Adjacent)" : "Out of Scope"
Regulators = unique list across selections
```

## Workspace Dashboard wiring

- **Industry Profile card** — chips of `PrivCybHub_Sector_ID — Sub_Sector` (click = open side panel detail).
- **Triggered Flags card** — read-only chips with tooltips citing the trigger.
- **Regulatory Crosswalk card** — three rows (GDPR / CCPA / HIPAA) with status chip + 1-line rationale.
- **Function tiles:**
  - **Assessment** → `/assessments?fromWorkspace=:id` — Assessments page reads the workspace, prefills industry on the new-assessment dialog (small additive read in `Assessments.tsx`; no behavioural change otherwise).
  - **Build** → `/policy-sop-builder?fromWorkspace=:id` — Policy Builder reads the workspace's industry chips into its existing Org-Context surface (additive; falls back silently if absent).
  - **Repository** → locked badge "Coming next" (toast on click).

## Visual design

Defers to existing dark slate + emerald/teal tokens (DM Sans / JetBrains Mono per project memory). Sunburst gets its own 16-hue cluster palette as new HSL tokens. Exposure chips reuse `RiskBadge` semantics. No new global CSS.

## Acceptance

- Sidebar **Execute** opens `/execute` with a single CTA.
- Sunburst renders all 88 records as a flower with 4 petal rings; hover panel shows full crosswalk; multi-select via Cmd/Ctrl works; disambiguation drawer fires when granularity demands.
- Org Profile validates and writes a row to `execute_workspaces`.
- Workspace Dashboard reloads from the row, shows Industry Profile, Triggered Flags, Regulatory Crosswalk and three tiles.
- Clicking **Assessment** lands on `/assessments` with the workspace's industry visible in the new-assessment context; clicking **Build** lands on Policy Builder with industry prefilled. Repository stays locked.
- No regression on `/dashboard`, `/assessments/*`, `/policy-*`, `/consent/*`.

## Open question (one)

Two of the three tiles can be **active** today (Assessment and Build, by passing `?fromWorkspace=:id`) or all three can ship as **locked** in this turn and be wired in the very next iteration. The plan above assumes **active** — confirm or say "ship locked" and I'll keep this turn purely additive with no edits to `Assessments.tsx` / `PolicySopBuilder.tsx`.
