

## Plan: Database-Driven Rapid Assessment with Multi-Framework Tabs

### Overview
Modify `PhaseRapidAssessment.tsx` to load domains/requirements from Supabase when the assessment has `framework_ids`, falling back to the static `DOMAINS` import for legacy assessments. Add a framework tab bar for multi-framework assessments.

### Changes

**File: `src/pages/PhaseRapidAssessment.tsx`** (modify)

1. **New state variables**:
   - `frameworks`: array of `{ id, name, short_code, colour }` for the assessment's frameworks
   - `activeDomains`: `Domain[]` — the working domain list (either from DB or static)
   - `selectedFrameworkId`: string | null — active framework tab filter
   - `isLegacy`: boolean — whether to use static data
   - `loading`: boolean

2. **Data loading on mount** (refactor the existing `useEffect`):
   - Fetch assessment row including `framework_ids` and `special_status`
   - If `framework_ids` is empty/null → set `isLegacy = true`, use `DOMAINS` from static import
   - If `framework_ids` has values:
     - Query `assessment_frameworks` for those IDs → populate `frameworks` state
     - Query `framework_domains` filtered by those framework IDs, ordered by `display_order`
     - Query `framework_requirements` for those domain IDs, ordered by `display_order`
     - Transform into `Domain[]` shape: map `section_ref` → `section`, `penalty_ref` → `penalty`, `conditional_flag` → `conditional`, requirements → `items` with `item_code` → `id`, `risk_level` → `risk`, `evidence_type` → `evidence`, `guidance` → `evidence` fallback
     - Track `sdfOnly` items (where `sdf_only = true`)
     - Set `selectedFrameworkId` to first framework
   - Load `assessment_checks` as before

3. **Framework tab bar** (new UI element):
   - Render above the domain picker only when `frameworks.length > 1`
   - Use shadcn `Tabs` component with framework short_codes as triggers
   - Filter `activeDomains` by the selected framework's domains

4. **Domain list and items rendering**:
   - Replace `DOMAINS` references with `activeDomains` (filtered by selected framework tab)
   - All existing rendering logic stays identical

5. **Save logic update** (`updateCheck`):
   - For non-legacy assessments, include `framework_id` and `requirement_id` in the insert call
   - Need a lookup map from `item_code` → `{ frameworkId, requirementId }` built during data transform
   - Legacy assessments continue inserting without these fields

### Technical Details

**DB → Domain transform**:
```text
framework_domains row → Domain {
  code: row.code,
  name: row.name,
  section: row.section_ref,
  penalty: row.penalty_ref,
  conditional: row.conditional_flag,
  sdfOnly: [items where sdf_only=true].map(i => i.item_code),
  items: framework_requirements[].map(r => ({
    id: r.item_code,
    description: r.description,
    risk: r.risk_level,
    evidence: r.evidence_type
  }))
}
```

**Requirement metadata map** (for save):
```text
Map<item_code, { frameworkId: string, requirementId: string }>
```

Built during transform, used in `updateCheck` to set `framework_id` and `requirement_id` on new `assessment_checks` rows.

### Files
| File | Action |
|---|---|
| `src/pages/PhaseRapidAssessment.tsx` | Modify: add DB loading, framework tabs, metadata-enriched saves |

No database changes needed — all tables already exist.

