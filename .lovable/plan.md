

## Plan: Clean up Framework Manager Layout & Visibility

### Root causes (confirmed from code + viewport 962px)

1. **Buttons overflow narrow columns** — Frameworks header has 3 buttons (Download icon + "Upload Pack" + "Add") in a `~320px` card. At anything below ~1100px the labels wrap or push behind the title. "Add" in Domains/Requirements headers gets hidden behind long titles like `Domains — DPDP`.
2. **Grid breakpoint mismatch** — `lg:grid-cols-3` activates at 1024px. User's viewport is 962px → stacks to 1 column, which crams everything and looks messy. Inside the dialog area, the columns also feel cramped because each column needs more horizontal room than `lg` provides.
3. **No internal scroll on columns** — Each `Card` uses `flex flex-col` with `ScrollArea flex-1`, but the parent grid uses `min-h-[calc(100vh-160px)]` (changed in last edit). With `min-h`, children expand rather than scroll — so long lists make the page scroll instead of scrolling inside the card. Result: header buttons disappear above the fold, no internal scroll.
4. **Upload Pack button label hidden** — at narrow widths "Upload Pack" wraps and pushes "Add" off the visible row.

### Fixes

**File: `src/pages/AdminFrameworkManager.tsx`**

1. **Restore fixed-height grid for proper internal scroll**
   - Change `min-h-[calc(100vh-160px)]` → `h-[calc(100vh-140px)]` and add `overflow-hidden` to each `Card` so `ScrollArea flex-1` actually scrolls inside.

2. **Lower the multi-column breakpoint**
   - `lg:grid-cols-3` → `md:grid-cols-3` so 3 columns kick in at 768px (matches the 962px viewport and similar laptops).

3. **Compact, always-visible header buttons (icon-only on small, label on wider)**
   - Frameworks header: collapse to icon-only buttons with tooltips at narrow widths; show labels at `xl:`.
     - Download (icon only, tooltip "Download Template")
     - Upload (icon only at narrow, "Upload Pack" at xl+)
     - Add (icon only at narrow, "Add" at xl+)
   - Domains/Requirements header: same — "Add" becomes icon-only when title is long.
   - Wrap buttons in `flex-shrink-0` and the title in `truncate min-w-0` so the title shortens before buttons disappear.

4. **Header layout safety**
   - Card header: `flex items-center justify-between gap-2` with title `truncate min-w-0 flex-1` and button group `shrink-0`.

5. **Stack header on extreme narrow (<640px)**
   - Use `flex-col sm:flex-row` so on phones the title sits above the buttons rather than buttons being clipped.

6. **Page wrapper**
   - Outer `<div className="p-4 md:p-6 space-y-4 h-[calc(100vh-0px)] flex flex-col overflow-hidden">` so the grid can use the remaining height cleanly without page scroll competing with internal scroll.

### Visual result (at 962px)

```text
┌────────── Framework Manager ──────────────────────────────┐
├─Frameworks───┬─Domains — DPDP─┬─Requirements ─ A.1───────┤
│ [↓][↑][+]   │ [+]            │ [+]                       │
│ DPDP    ⚙  │ A.1 Notice ›   │ A.1.1 [crit][Doc] ...     │
│ GDPR    ⚙  │ A.2 Consent ›  │ A.1.2 [high][Log] ...     │
│ ▼ scroll ▼  │ ▼ scroll ▼    │ ▼ scroll ▼                │
└─────────────┴────────────────┴──────────────────────────┘
```

All three columns visible side-by-side at 962px, each with its own internal scroll. Add/Upload/Download icons always visible.

### Files modified
| File | Change |
|---|---|
| `src/pages/AdminFrameworkManager.tsx` | Grid breakpoint `md:` instead of `lg:`, fixed-height grid + Card `overflow-hidden`, icon-only buttons at narrow widths with `xl:` labels, header truncation |

### Out of scope
- Other dashboards (will tackle next if user reports issues there)
- Login/OAuth (environment-specific)

