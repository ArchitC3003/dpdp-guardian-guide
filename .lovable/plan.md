

# Implementation Plan: 4 Changes to PrivcybHub

## Change 1 -- Replace Shield with Cog Icon

**Files:** `src/components/AppSidebar.tsx`, `src/pages/Auth.tsx`, `src/pages/ProfileSetup.tsx`

- In `AppSidebar.tsx`: Replace `Shield` import with `Cog`, replace `<Shield>` JSX with `<Cog>`
- In `Auth.tsx`: Replace `Shield` import with `Cog`, replace `<Shield>` JSX with `<Cog>`
- In `ProfileSetup.tsx`: Replace `Shield` import with `Cog`, replace `<Shield>` JSX with `<Cog>`

## Change 2 -- Rebrand to "PrivcybHub"

**Files to update:**

| File | What changes |
|------|-------------|
| `index.html` | Title, meta description, og:title |
| `package.json` | name field to "privcybhub" |
| `src/components/AppSidebar.tsx` | Brand text "DPDP Comply" to "PrivcybHub" |
| `src/pages/Auth.tsx` | Brand text "DPDP Comply" to "PrivcybHub" |
| `src/pages/ProfileSetup.tsx` | Brand text "DPDP Comply" to "PrivcybHub" |
| `src/pages/Dashboard.tsx` | Keep subtitle "DPDP Act, 2023 Compliance Overview" unchanged (no product name there) |

## Change 3 -- Rename Sidebar Nav Item

In `AppSidebar.tsx`, change `mainNav` entry title from `"Repository"` to `"Assessment Repository"`.

## Change 4 -- Rebuild Repository Page

Delete and rebuild both `src/data/repositoryData.ts` and `src/pages/Repository.tsx` from scratch.

### New Data File: `src/data/repositoryData.ts`

Exports `repositoryPhases` array with 6 phases containing `RepositoryItem` objects. Each item has:
- `id`, `requirement`, `dpdpRef`, `templateTitle`, `templateContent`, `domain?`, `status`, `notes`

Content coverage:
- **Phase 1 (Org Profile):** 8 items covering incorporation cert, org chart, data flow diagram, DPO appointment, board resolution, processor register, joint controller agreement, regulatory licences
- **Phase 2 (Policy Matrix):** 37 items covering all privacy notices, consent policies, DPAs, retention, DPIA, children's data, rights procedures, breach response, security, vendor management, training, audit, AI policy, PbD checklist
- **Phase 3 (Rapid Assessment):** 30 items grouped across Domains A-O with domain field set
- **Phase 4 (Dept Grid):** 6 items covering dept inventory, flow maps, RACI, self-assessment, gap analysis, corrective action
- **Phase 5 (File References):** 6 items covering master index, regulatory links, sector guidelines, court judgements, version history, archived docs
- **Phase 6 (Dashboard Reports):** 7 items covering score report, heat map, penalty map, audit trail, board summary, shared links, version archive

Each item includes a full templateContent string (80-300 words) with placeholders like `[Organisation Name]`, `[Date]`, `[DPO Name]`, etc. The 3 templates provided in the spec (DPO Appointment Letter, Board Resolution, Processor Register) will be used verbatim. All others will be written as realistic compliance document templates.

### New Page: `src/pages/Repository.tsx`

A structured compliance knowledge base page with:

1. **Header**: Title "Assessment Repository" + subtitle + Export Checklist button
2. **Filter Bar**: Search input, status filter dropdown, phase filter dropdown
3. **Stats Bar**: 4 cards showing Total / Completed / In Progress / Not Started counts
4. **Phase Accordions**: 6 collapsible sections, each with:
   - Folder icon + phase title + count badge + chevron toggle
   - Table with columns: #, Requirement, DPDP Ref, Template (View button), Status (select dropdown), Notes (textarea)
   - Phase 3 gets domain sub-sections (A-O), each collapsible
5. **Template Modal**: Dialog showing template content with Copy to Clipboard and Download as .txt buttons

State management: all local (searchQuery, statusFilter, phaseFilter, expandedPhases, expandedDomains, selectedItem, itemStatuses, itemNotes, copiedId).

Design: dark slate theme with `bg-slate-800/50` cards, alternating table rows, colored status badges (grey/yellow/green).

### Technical Details

- No database changes needed -- all data is static/local
- No new dependencies required
- Route `/repository` already exists in `App.tsx` -- no routing changes needed
- Filtering logic: search matches requirement OR templateTitle; status matches current status; phase shows matching accordion only; stats reflect filtered counts
