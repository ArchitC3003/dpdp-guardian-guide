

## Plan: Fix Scroll Clipping Across the App and PPT Slides

### Findings — where data gets clipped

**A) Web app — dialogs and panels**

| Location | Problem |
|---|---|
| `src/components/ui/dialog.tsx` (base `DialogContent`) | No `max-h` or overflow — any tall dialog spills off-screen. Affects every `DialogContent` that doesn't set its own `max-h`. |
| `AdminFrameworkManager.tsx` Framework Dialog (line 688), Domain Dialog (720), Requirement Dialog (746) | Long forms get cut off on smaller viewports (≤768px). |
| `AdminFrameworkManager.tsx` Pack Dialog Step 2 (line 909) | Tabs each show `ScrollArea h-[260px]` — only first 20 rows shown for some tabs (artefacts/controls/flags don't show "+ X more"). |
| `Assessments.tsx` Template Picker (line 351) | No `max-h` on dialog itself; inner grid has `max-h-[60vh]` but if many frameworks per template card → still clips. |
| `AdminAssessmentTemplates.tsx` Create Template (line 360) | Frameworks list `ScrollArea h-48` — fine, but dialog itself has no `max-h`, preview block can push footer offscreen. |
| `AccountSettings.tsx` Delete Confirm Dialog (274) | No max-h. |
| `PrivacyPreferences.tsx` Detail dialogs (241, 289) | No max-h. |
| `AssessmentRepoGenerator.tsx` (567) | No max-h. |
| `KMAdminPanel.tsx` (172) | No max-h. |

**B) Pages with full-height grids that lose footer/content**
- `AdminFrameworkManager.tsx` (line 505): `h-[calc(100vh-160px)]` — assumes fixed header heights; on small viewports the inner cards' ScrollArea works but the grid itself can clip.
- `PhaseDeptGrid.tsx` table — has horizontal `overflow-x-auto` but no vertical bound.

**C) PowerPoint export (`src/lib/exportPpt.ts`) — slide overflow**
- **Score Overview** (line 44): hardcoded 4×2 grid of metric cards in a 7"-wide area. If a future metric is added, it overflows the slide bottom.
- **Domain Scores table** (line 79): has `autoPage: true` ✓ already paginates.
- **Penalty table** (line 152): no `autoPage` — long penalty maps run off the slide.
- **Narrative slide** (line 216): fixed-height shape `h: 3.5"`, fixed text box `h: 3.1"`. Long AI narratives are silently truncated by PowerPoint.
- **Domain Chart** (line 125): single slide; if domains > ~15, bar labels become unreadable / clip.

### Changes

**1. Make every dialog scroll by default** — `src/components/ui/dialog.tsx`
- Add `max-h-[90vh] overflow-y-auto` to `DialogContent`'s base classes. This is a one-line fix that benefits every dialog, including all the un-bounded ones above. Existing dialogs with explicit `max-h-[90vh]` already work.

**2. Make every Sheet (slide-over) scroll** — verify `src/components/ui/sheet.tsx` `SheetContent` has `overflow-y-auto`; add if missing. Most existing usages already pass it but the base default makes it foolproof.

**3. AdminFrameworkManager Pack Dialog Step 2** — add "+ X more" row to the artefacts/controls/flags tabs (currently only checklist shows it), and bump preview row count from 20 → 50 to surface more data.

**4. AdminFrameworkManager main grid** — change `h-[calc(100vh-160px)]` to `min-h-[calc(100vh-160px)]` so on small viewports it grows naturally and the page itself scrolls.

**5. Specific dialogs needing extra care** (in addition to the global fix):
- `Assessments.tsx` Template Picker → add `max-h-[85vh] flex flex-col` and wrap inner grid in a flex-1 scroll container.
- `AdminAssessmentTemplates.tsx` Create Template → same pattern so the Save button stays visible.

**6. PowerPoint export fixes** — `src/lib/exportPpt.ts`
- **Penalty slide**: add `autoPage: true, autoPageRepeatHeader: true` to the penalty table.
- **Narrative slide**: split long narratives across multiple slides using a paginator helper (~2,000 chars per slide), with "Narrative (continued)" titles.
- **Domain chart slide**: if `domainScores.length > 12`, split into two chart slides (first half / second half) so bar labels stay legible.
- **Score overview**: convert the 8-card metric block from hardcoded coords into a loop with computed grid sizing so additional metrics flow safely. Keep visual identical for current 8 cards.
- **All slides**: add a small footer `"PrivcybHub · Page X of Y · Confidential"` so users know if they're missing pages.

### Files modified
| File | Change |
|---|---|
| `src/components/ui/dialog.tsx` | Add `max-h-[90vh] overflow-y-auto` to base `DialogContent` |
| `src/components/ui/sheet.tsx` | Ensure `SheetContent` defaults to `overflow-y-auto` |
| `src/pages/AdminFrameworkManager.tsx` | Fix Pack preview tabs ("+ X more" everywhere, 50 rows), grid min-h |
| `src/pages/Assessments.tsx` | Template Picker dialog → `max-h-[85vh] flex flex-col` |
| `src/pages/AdminAssessmentTemplates.tsx` | Create Template dialog → flex-col scroll body |
| `src/lib/exportPpt.ts` | Penalty `autoPage`, narrative pagination, chart split, metric loop, slide footer |

### Out of scope
- Login/OAuth issues (separate, environment-specific).
- New features (Export Pack, replace mode, framework seeds) — already on backlog.

