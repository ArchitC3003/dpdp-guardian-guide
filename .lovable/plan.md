

## Plan: Multi-Framework Assessment Engine — Database Migration

### Overview
A single SQL migration that creates 6 new tables, alters 2 existing tables, adds RLS policies, updated_at triggers, and seeds the DPDP framework with all 15 domains and 88 requirements from `assessmentDomains.ts`.

### Migration SQL Structure

**1. Create Tables** (in dependency order):
- `assessment_frameworks` — framework registry
- `framework_domains` — domains per framework (FK → assessment_frameworks)
- `framework_requirements` — requirements per domain (FK → framework_domains)
- `assessment_templates` — reusable assessment templates
- `assessment_template_frameworks` — M2M join (FK → templates + frameworks)
- `cross_framework_mappings` — requirement-to-requirement mappings (FK → framework_requirements)

**2. Alter Existing Tables**:
- `assessments`: add `template_id` (uuid FK → assessment_templates, nullable), `framework_ids` (uuid[] default '{}')
- `assessment_checks`: add `framework_id` (uuid FK → assessment_frameworks, nullable), `requirement_id` (uuid FK → framework_requirements, nullable)

**3. RLS Policies** (same pattern for all 6 new tables):
- Enable RLS
- `SELECT` for `authenticated`: `USING (is_active = true)` (or `USING (true)` for join tables without is_active)
- `INSERT/UPDATE/DELETE` for `authenticated`: admin-only via `has_role(auth.uid(), 'admin')`

**4. Triggers**:
- `updated_at` trigger on `assessment_frameworks` and `assessment_templates` using existing `update_updated_at_column()` function

**5. Seed Data**:
- Insert DPDP Act 2023 framework with a fixed UUID
- Insert all 15 domains (A–O) with fixed UUIDs, mapping `conditional` and `section`/`penalty` fields
- Insert all 88 requirements across all domains, with `sdf_only` flag set for L.7–L.10
- Create a default "DPDP Full Assessment" template linked to the DPDP framework

### Safety
- All ALTERs use `ADD COLUMN IF NOT EXISTS` pattern (or just nullable columns with defaults) — no data loss
- No modification to existing rows in `assessments` or `assessment_checks`
- Existing assessment workflow continues to work unchanged
- No changes to application code in this migration

### File
| File | Action |
|---|---|
| `supabase/migrations/[timestamp]_multi_framework_engine.sql` | Create: full migration with schema + RLS + triggers + seed |

