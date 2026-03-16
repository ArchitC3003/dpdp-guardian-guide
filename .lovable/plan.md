

## Knowledge Management Intelligence Layer — Implementation Plan

This is a large, multi-phase feature spanning database schema, edge functions, a retrieval service, and several UI components. Here is the structured plan.

---

### Phase 1: Database Schema Migration

Create three new tables and a vector search function via a single migration:

| Table | Purpose |
|---|---|
| `km_artefact_index` | Master knowledge store with pgvector embeddings (1536-dim) |
| `regulatory_source_map` | Industry-to-regulation mapping |
| `km_query_log` | Analytics/improvement log |

**Key details:**
- Enable `vector` extension (`CREATE EXTENSION IF NOT EXISTS vector`)
- Create `match_km_artefacts` plpgsql function for similarity search
- RLS: `km_artefact_index` and `regulatory_source_map` readable by all authenticated users; `km_query_log` insertable by authenticated users, readable by admins
- Admin-only write policies for `km_artefact_index` and `regulatory_source_map`

---

### Phase 2: Static Data & Seed File

**Create `src/data/regulatorySourceMap.ts`** — Export the typed `REGULATORY_SOURCE_MAP` array with ~25 entries covering India/DPDP, Healthcare, BFSI, E-commerce, Manufacturing, EdTech, Technology/IT, and cross-industry international frameworks. This is a static client-side lookup used for instant regulatory source resolution without a DB call.

---

### Phase 3: KM Retrieval Service

**Create `src/services/kmRetrievalService.ts`** with:
- `getRegulatorySources(industries, jurisdictions?)` — instant sync filter over static map
- `searchKMArtefacts(queryText, industries, maxResults)` — calls `km-search` edge function
- `getKMContext(industries, subSector, contextType)` — orchestrator that combines regulatory sources, semantic search, and AI enrichment; logs query to `km_query_log`
- Falls back gracefully to existing `sectorIntelligence.ts` data if AI enrichment fails

---

### Phase 4: Edge Functions

**4A: `supabase/functions/km-search/index.ts`**
- Receives `{ queryText, industries, maxResults }`
- Generates text embedding via Lovable AI Gateway (using Gemini model for text embedding — note: the gateway supports chat completions, so we'll use a lightweight approach: call the gateway to generate a semantic summary, then fall back to keyword-based search via SQL `tsvector` or array overlap if pgvector embeddings aren't populated yet)
- Calls `match_km_artefacts` RPC if embeddings exist, otherwise falls back to keyword/tag filtering
- Returns matched artefacts

**4B: `supabase/functions/km-ai-enrichment/index.ts`**
- Receives `{ industries, subSector, contextType, regulatorySources, artefactSnippets }`
- Uses Lovable AI Gateway with `google/gemini-3-flash-preview` model
- System prompt: Senior DPO expert with DPDP/GDPR knowledge
- Returns structured JSON: `personalDataTypes`, `processingActivities`, `sensitiveDataFlags`, `subSectorInsights`, `mandatoryCompliances`, `recommendedFrameworks`
- Uses tool calling for structured output extraction
- Handles 429/402 errors gracefully

**4C: `supabase/functions/km-indexer/index.ts`**
- Fetches `km_artefact_index` rows with NULL embeddings
- For each row, generates embedding via Lovable AI Gateway (using the chat model to produce a dense summary, then storing as a placeholder — or using Gemini embedding if available)
- Updates `content_embedding` column
- Note: Since Lovable AI Gateway only exposes chat completions (not embedding endpoints), we'll implement a keyword/tag-based fallback search that works without embeddings, and document that embeddings can be populated when a dedicated embedding API is configured

**Config:** Update `supabase/config.toml` to register all three functions with `verify_jwt = false`

---

### Phase 5: UI Components

**5A: `src/components/km/KMSourcesPanel.tsx`**
- Collapsible card below Industry fields in OrgProfileForm
- Header: "Knowledge Sources Active" with count badges
- Expanded: regulatory authority chips (clickable → opens source URL), internal artefact list with doc_type and version badges
- Footer: knowledge snapshot date + attribution

**5B: `src/components/km/SectorInsightsPanel.tsx`**
- Below Sub-Sector input
- Shows privacy risk narrative, framework chips, mandatory compliance bullets
- "Regenerate" button to re-call `getKMContext()`

**5C: Update OrgProfileForm**
- Import and render KMSourcesPanel and SectorInsightsPanel
- Add `useEffect` that calls `getKMContext()` when industries/subSector change (debounced)
- Mark sensitive data types with red badge, AI-suggested with sparkle badge
- Loading skeletons while KM context loads; form remains usable

**5D: Chatbot Integration**
- In `PrivacyAssistant.tsx`, before each AI call, fetch KM context
- Inject `subSectorInsights` + top 3 artefact snippets + regulatory sources into the system prompt sent to the edge function
- Show expandable "Sources" section at bottom of each reply

---

### Phase 6: Artefact Repository Admin Enhancements

Update `ArtefactRepository.tsx` to add:
- "Add to KM Index" toggle per artefact (admin only) — inserts/updates `km_artefact_index`
- KM metadata form: industry_verticals, sub_sectors, jurisdictions, frameworks (tag inputs), source_authority, source_url, effective_date
- "KM Status" badge: Indexed/Pending/Not Indexed (checks `km_artefact_index` for matching file)
- "Re-Index All" button that invokes `km-indexer` edge function

---

### Implementation Order & File Changes

1. **Database migration** — 1 migration with all tables, function, RLS policies
2. **`src/data/regulatorySourceMap.ts`** — new file
3. **`src/services/kmRetrievalService.ts`** — new file
4. **`supabase/functions/km-search/index.ts`** — new edge function
5. **`supabase/functions/km-ai-enrichment/index.ts`** — new edge function
6. **`supabase/functions/km-indexer/index.ts`** — new edge function
7. **`supabase/config.toml`** — add 3 function entries
8. **`src/components/km/KMSourcesPanel.tsx`** — new component
9. **`src/components/km/SectorInsightsPanel.tsx`** — new component
10. **`src/components/policy-builder/OrgProfileForm.tsx`** — integrate KM panels + badge enhancements
11. **`src/components/PrivacyAssistant.tsx`** — inject KM context into chatbot
12. **`src/pages/ArtefactRepository.tsx`** — add KM index admin features

### Safety Guardrails
- All existing functionality (OrgProfileForm, Policy Builder, Assessment, Chatbot) remains unchanged
- KM panels are additive — they show loading skeletons and gracefully degrade if edge functions fail
- Falls back to existing `sectorIntelligence.ts` and `smartContextEngine.ts` when KM layer is unavailable

