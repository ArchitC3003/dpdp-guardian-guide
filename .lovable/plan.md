# Add Data Role Identification to Phase 1

## 1. Database migration
Add four columns to `assessments`:
- `dpdp_role` text — one of `data_fiduciary | joint_data_fiduciary | data_processor | dual_role` (nullable)
- `is_joint_fiduciary` boolean default false
- `is_dual_role` boolean default false
- `role_identified_at` timestamptz (nullable)

A CHECK constraint will restrict `dpdp_role` to the four allowed values. Existing assessments stay nullable so they don't break.

## 2. UI changes — `src/pages/PhaseOrgProfile.tsx`

Insert a new `<Card>` between "Organisation Details" and "Special Status Determination", styled identically to Special Status (same border, bg-card, 2-col md grid, same tile padding/border treatment).

**Header**
- Title: "Data Role Identification"
- Muted subtext under title (text-sm text-muted-foreground): the explanatory copy provided.

**Tiles (4, single-select)**
Use the existing tile pattern (button + visual selected state matching Special Status tiles). Selection is mutually exclusive — clicking one clears the others. Each tile shows title + descriptor + the section reference inline in the descriptor as specified.

Mapping:
| Tile | dpdp_role | is_joint_fiduciary | is_dual_role |
|---|---|---|---|
| 1 | data_fiduciary | false | false |
| 2 | joint_data_fiduciary | true | false |
| 3 | data_processor | false | false |
| 4 | dual_role | false | true |

**Result banner**
Below tiles, a soft strip (rounded, bg with role-coloured tint, border) appears when a role is selected:
- `Badge` with role label, coloured per spec:
  - Data Fiduciary → blue
  - Joint Data Fiduciary → teal
  - Data Processor → amber
  - Dual Role → purple
- One-line statutory implication text alongside the badge.

Colours implemented via inline style + soft alpha background, matching the existing `FrameworkBadge` pattern (border + tinted bg) so we don't need new design tokens.

**Validation**
- Add a `triedAdvance` state.
- Convert the existing top-right "Next Phase" button to be `disabled={!assessment.dpdp_role}`.
- If user clicks while disabled (we wrap navigate handler), set `triedAdvance=true`; show inline muted text under tiles: "Please identify your organisation's data role to continue."
- Note: button `disabled` prevents click — so we'll instead always render but check role on click; if missing, show the inline message and don't navigate. This keeps the message reachable without adding new buttons.

**Persistence**
On tile click, call existing `save()` with `{ dpdp_role, is_joint_fiduciary, is_dual_role, role_identified_at: new Date().toISOString() }`.

## 3. Downstream gating — `src/pages/PhaseRapidAssessment.tsx`

Load `dpdp_role` from assessment alongside `special_status`. Apply gating in the existing `isDomainEnabled` / domain filter logic:

- **data_fiduciary**: current behaviour (full fiduciary set; no processor-specific domains).
- **joint_data_fiduciary**: same as fiduciary, plus a small banner above the domain content: "Document your inter-se arrangement with your co-fiduciary — this will be assessed in Phase 3".
- **data_processor**: hide consent (B), notice (A), grievance, and data principal rights domains. Show only Processor-relevant domains (security, breach, contracts, logs). Implementation: filter `allDomains` by domain code allowlist for processor mode (`E, F, G/contracts, logs`) — exact codes resolved from the loaded framework. Where unsure, fall back to "all except A/B/grievance/rights".
- **dual_role**: render two sections in the domain list, labelled "As Data Fiduciary" and "As Data Processor". Both tracks visible; same domains shown twice is avoided by grouping the existing domains under the two labels (fiduciary group: full set; processor group: processor-only subset).

If `dpdp_role` is null (legacy assessments), behave as data_fiduciary (current default) so existing flows aren't broken.

## 4. Types
`src/integrations/supabase/types.ts` regenerates automatically after the migration — no manual edit.

## 5. Memory
Update `mem://features/assessment-workflow` with a note that Phase 1 now captures DPDP data role and gates the Rapid Assessment track accordingly.

## Files touched
- new migration: add 4 columns + check constraint on `assessments`
- `src/pages/PhaseOrgProfile.tsx` — new section, validation, gated next
- `src/pages/PhaseRapidAssessment.tsx` — load role, gate domains, dual-role grouping, joint-fiduciary banner
- `mem://features/assessment-workflow` — update

## Out of scope
- No new buttons, no new shadcn components installed.
- Phase 3 wiring of the inter-se agreement check is left as a future task (only the banner is added now).
