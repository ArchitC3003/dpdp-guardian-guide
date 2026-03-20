

## Plan: Policy & SOP Builder Depth Upgrade

### Overview
5 parts: edge function prompt enhancement, assessment linkage UI, clause library panel, preview enhancements, and template version control DB table. No changes to Assessment Repository Generator, Consent module, or KM layer.

---

### Part 1: Document Generation Depth — Edge Function

**File: `supabase/functions/generate-policy/index.ts`**

Enhance the system prompt (`FALLBACK_SYSTEM_INSTRUCTION`) with additional rules:

- **RULE 11 — POLICY SKELETON**: Enforce mandatory section structure for policies (Purpose & Scope, Legal & Regulatory Basis, Definitions (min 8), RACI Roles, min 12 numbered clauses, Implementation Requirements, Exceptions Process, Monitoring/Audit, Non-Compliance, Version Control table). Each major section must end with Regulatory Reference and Implementation Guidance blocks.

- **RULE 12 — SOP SKELETON**: Enforce SOP structure (Objective & Triggers, Scope, Roles with escalation path, step-by-step with IF/THEN logic, SLA & Timelines table, Evidence requirements, Escalation Matrix L1→L2→DPO→Board, Communication Templates, Exception Handling, Review Cycle).

- **RULE 13 — WORD COUNT**: Policies minimum 2,500 words; SOPs minimum 2,000 words. Add: "CRITICAL: The document MUST be comprehensive and production-ready. A short or skeletal output is a FAILURE."

- **RULE 14 — PERSONALISATION**: Rules A-G as specified (org name in every clause, all personalDataTypes referenced, all processingActivities mapped to legal basis, sector-specific citations with section numbers, children's data section if applicable, Quick Start appendix for maturity <= 2, Advanced Controls appendix for maturity >= 4).

- **RULE 15 — GAP REMEDIATION**: If `assessmentGaps[]` is provided in the request body, create a dedicated "Gap Remediation Clauses" section addressing each gap with a specific policy commitment.

Add `assessmentGaps` to the destructured request body. Inject gap remediation context into the user prompt when present.

Determine whether document is Policy or SOP from `documentType` string (starts with "sop-") and inject the appropriate skeleton rule into the prompt.

---

### Part 2: Assessment Linkage — DocumentConfigSection

**File: `src/components/policy-builder/DocumentConfigSection.tsx`**

Add a collapsible "Link Assessment Findings" card below the document type selector:

- Query `assessments` table filtered by `user_id` (via `useAuth`) for completed assessments
- Show checkboxes for each assessment with org_name, status, industry
- When checked, query `assessment_checks` for that assessment_id to extract gaps (items with status != "Compliant")
- Pass extracted gaps up via a new `onAssessmentGapsChange?: (gaps: string[]) => void` prop

**File: `src/pages/PolicySopBuilder.tsx`**

- Add `assessmentGaps` state
- Pass to `DocumentConfigSection` and forward to `streamChat.ts`

**File: `src/components/policy-builder/streamChat.ts`**

- Add `assessmentGaps` to the request body sent to the edge function

---

### Part 3: Clause Library Panel

**File: `src/components/policy-builder/ClauseLibraryPanel.tsx`** (new)

- Right-side collapsible drawer with toggle button "Clause Library"
- Static seed of 30 clause snippets organized by document type, topic, and regulation
- Each clause card: title, 2-line preview, regulation badge (color-coded), "Copy to Context" button
- Search bar for keyword filtering
- "Copy to Context" appends clause text to `additionalContext` textarea via callback

**Categories**: 5 consent (DPDP), 5 retention (sector-specific), 5 breach notification (DPDP 72h/CERT-In 6h), 5 vendor/third-party, 5 employee obligations, 5 security controls (CERT-In aligned)

**Integration in `src/pages/PolicySopBuilder.tsx`**:
- Render ClauseLibraryPanel with `onCopyToContext` callback that appends to orgContext.additionalContext

---

### Part 4: Document Preview Enhancements

**File: `src/components/policy-builder/FullWidthPreview.tsx`**

**4A — Document Quality Indicator** (above generated content):
- 3 circular progress indicators: Completeness (sections present vs expected), Personalisation (org name mentions vs generic), Regulatory Coverage (distinct regulation citations)
- Calculated by parsing the `latestResponse` text for headings, org name occurrences, and regulatory citation patterns like `[DPDP`, `[NIST`, `[ISO`

**4B — Export Options** dropdown additions:
- Existing: DOCX, PDF
- Add: "Copy as Markdown" (copies raw text), "Copy as Plain Text" (strip markdown formatting), "Send for Review" (mailto: with subject + first 200 chars as body)

**4C — Section Navigation** sidebar:
- Parse H2/H3 headings from latestResponse
- Render as a sticky sidebar on the left (on desktop widths)
- Each heading is clickable → scrolls to that section via `id` attributes added to rendered headings
- Highlight current section on scroll using IntersectionObserver

---

### Part 5: Template Version Control

**Database migration**: Create `policy_builder_snapshots` table (avoids conflict with existing `policy_versions`):
```sql
CREATE TABLE policy_builder_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT,
  org_context JSONB,
  generated_content TEXT,
  version_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  change_notes TEXT
);
ALTER TABLE policy_builder_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own snapshots" ON policy_builder_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON policy_builder_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own snapshots" ON policy_builder_snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage snapshots" ON policy_builder_snapshots FOR ALL USING (has_role(auth.uid(), 'admin'));
```

**File: `src/pages/PolicySopBuilder.tsx`**:
- After each generation completes (`onDone`), auto-save to `policy_builder_snapshots` with version_number = max + 1
- This is in addition to existing `usePolicyVersioning` save

Note: The existing `usePolicyVersioning` hook + `VersionHistoryPanel` already provides version history, view, and restore functionality. The new table provides a separate snapshot layer that also stores `org_context` as JSONB for full context reproducibility. The existing Version History button and panel remain as-is.

---

### File Change Summary

| File | Action |
|---|---|
| `supabase/functions/generate-policy/index.ts` | Edit: add Rules 11-15, assessmentGaps handling |
| `src/components/policy-builder/DocumentConfigSection.tsx` | Edit: add Assessment Linkage section |
| `src/components/policy-builder/ClauseLibraryPanel.tsx` | Create: 30-clause library drawer |
| `src/components/policy-builder/FullWidthPreview.tsx` | Edit: quality indicators, export options, section nav |
| `src/components/policy-builder/streamChat.ts` | Edit: pass assessmentGaps |
| `src/pages/PolicySopBuilder.tsx` | Edit: wire assessmentGaps, clause library, snapshot auto-save |
| Database migration | Create `policy_builder_snapshots` table |

### Safety
- Assessment Repository Generator, Consent module, KM layer, App.tsx routing untouched
- All new UI uses existing shadcn/ui components
- Edge function changes are additive prompt rules only

