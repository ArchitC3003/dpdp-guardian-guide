

## Implementation Plan: Auto-Population Pipeline, Quality Score, Maturity Calibration & Structured Business Context

### Overview
Seven changes across 3 files (2 new, 3 modified). No breaking changes to existing UI or edge functions beyond additive prompt injection.

---

### 1. Create `src/data/industryPersonalDataMap.ts` (new file)
- Export `INDUSTRY_PERSONAL_DATA_MAP: Record<string, string[]>` with all 17 industries
- Export `getPersonalDataForIndustries(industries: string[]): string[]` helper

### 2. Update `src/components/policy-builder/orgContextTypes.ts`
- Add `StructuredBusinessContext` interface and `structuredContext` field to `OrgContext` + `DEFAULT_ORG_CONTEXT`
- Replace `getOrgProfileCompleteness()` with `getOrgProfileQualityScore()` returning weighted score, percentage, colour, and `FieldQualityItem[]` with impact strings and sectionRef IDs
- Add `hasAnyStructuredContext()` helper
- Include `structuredContext` as a weighted field (weight: 8)

### 3. Update `src/components/policy-builder/OrgProfileForm.tsx`
Major additions:

**A. Personal Data Auto-Population Pipeline (Fix 3)**
- Add `personalDataSources: Record<string, "static" | "ai" | "manual">` state
- New `useEffect` watching `industries`/`sector`: immediately populates from static `INDUSTRY_PERSONAL_DATA_MAP`, marks as "static"; then background KM enrichment merges AI results marked as "ai"
- Manual entries tracked as "manual"
- Never clears user-added items on re-trigger

**B. Source Badges on Personal Data Chips (Fix 3 Step 3)**
- Grey "KB" badge for static items
- Purple "✨ AI" badge for AI-enriched items
- Blue "✏️" badge for manual items
- 🔴 red dot for sensitive data types (existing logic preserved)

**C. Decoupled Document Type Phase 2 (Fix 6)**
- New `useEffect` watching `documentType`: calls KM enrichment with doc-specific context type
- Merges results on top of Phase 1 without clearing
- Shows toast: "Added N additional data types for {docType}"

**D. Quality Score System (Fix 8)**
- Replace old `{filled}/{total}` display with colour-coded progress bar (red/amber/green)
- Show "Quality Score: N%" next to bar
- Collapsible "Improve your document quality" nudge panel showing unfilled fields with impact text
- Each nudge item clickable → scrolls to section via `sectionRef` with highlight pulse
- Add `id` attributes to each form section matching sectionRef values
- Score recalculates via `useMemo` on every ctx change

**E. Structured Business Context Fields (Fix 9)**
- New "Quick Business Facts" section (id="org-structured-context") ABOVE the textarea with 6 fields:
  1. Cloud/Hosting Provider (text input)
  2. DSAR Response SLA (dropdown: 24h–30d)
  3. Breach Notification SLA (dropdown: 6h–72h)
  4. Payment Processors (text input)
  5. Children's Data Processing (radio: Yes/No)
  6. Key Third-Party Vendors (textarea, 2 rows)
- Each field has a "📋 Clause Impact" tooltip
- Wire to `ctx.structuredContext`

### 4. Update `supabase/functions/generate-policy/index.ts`

**A. Maturity Calibration (Fix 7)**
- Add `MATURITY_CALIBRATION` constant with detailed Level 1–5 calibration blocks (clause depth, governance structures, language register)
- Enhance RULE 5 in `FALLBACK_SYSTEM_INSTRUCTION` to reference the calibration block
- Inject `${maturityBlock}` into the user prompt after sector overlays and before the quality gate
- Extract `maturityLevel` from request body (already done via destructuring)

**B. Structured Business Rules (Fix 9 Step 3)**
- Add `buildStructuredBusinessRules(structuredContext)` function generating "ABSOLUTE BUSINESS RULES" block
- Extract `structuredContext` from request body
- Inject `${structuredRules}` into user prompt after maturity calibration block

---

### File Change Summary

| File | Action |
|---|---|
| `src/data/industryPersonalDataMap.ts` | Create |
| `src/components/policy-builder/orgContextTypes.ts` | Edit: add types, replace quality score |
| `src/components/policy-builder/OrgProfileForm.tsx` | Edit: auto-population pipeline, badges, quality score UI, structured context fields |
| `supabase/functions/generate-policy/index.ts` | Edit: add maturity calibration + structured business rules to prompt |

### Safety
- All existing smart context inference, KM integration, chatbot, consent module unchanged
- Edge function only receives additive prompt blocks — no restructuring
- Existing `processingActivities` catalogue UI untouched
- `streamChat.ts` not modified

